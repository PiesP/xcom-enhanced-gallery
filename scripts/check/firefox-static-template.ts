import { parse } from 'acorn';
import { fullAncestor } from 'acorn-walk';

type Node = { type: string; start: number; end: number; [key: string]: unknown };

function child(node: Node, key: string): Node {
  const value = node[key];
  if (typeof value !== 'object' || value === null || !('type' in value)) {
    throw new Error(`Unreviewed Solid template shape: missing ${key}`);
  }
  return value as Node;
}

function name(node: Node): string | undefined {
  return node.type === 'Identifier' ? (node.name as string) : undefined;
}

function member(node: Node, property: string): boolean {
  if (node.type !== 'MemberExpression') {
    return false;
  }
  const key = child(node, 'property');
  return node.computed === false
    ? name(key) === property
    : key.type === 'Literal' && key.value === property;
}

function templateElementCall(node: Node, method: string): boolean {
  if (node.type !== 'CallExpression' || !member(child(node, 'callee'), method)) {
    return false;
  }
  const callee = child(node, 'callee');
  if (name(child(callee, 'object')) !== 'document') {
    return false;
  }
  const args = node.arguments;
  if (!Array.isArray(args)) {
    return false;
  }
  const last = args.at(-1) as Node | undefined;
  return last?.type === 'Literal' && last.value === 'template';
}

function isFunction(node: Node): boolean {
  return ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(
    node.type
  );
}

function shadowsFactory(chain: Node[], factory: Node, factoryName: string): boolean {
  // A local binding in an enclosing function wins over the IIFE-level Solid factory.
  for (const scope of chain.filter(isFunction).reverse()) {
    if (scope === factory) {
      continue;
    }
    const params = scope.params;
    if (Array.isArray(params) && params.some((param) => name(param as Node) === factoryName)) {
      return true;
    }
    let local = false;
    fullAncestor(scope, (value, _state, ancestors) => {
      const node = value as Node;
      if (node.type !== 'VariableDeclarator' || name(child(node, 'id')) !== factoryName) {
        return;
      }
      const owner = [...ancestors]
        .slice(0, -1)
        .reverse()
        .find((item) => isFunction(item as Node));
      const declaration = ancestors.at(-2) as Node | undefined;
      const directBlock = ancestors.at(-3) as Node | undefined;
      // Only proven function-body var scope or direct lexical-block bindings
      // may shadow this one factory name. Loop/switch/static-block declarations
      // have other scopes and require review instead of hiding a reference.
      const bindingScope =
        declaration?.kind === 'var'
          ? child(scope, 'body')
          : directBlock?.type === 'BlockStatement' &&
              Array.isArray(directBlock.body) &&
              directBlock.body.includes(declaration)
            ? directBlock
            : undefined;
      const staticBlock = ancestors.some((item) => (item as Node).type === 'StaticBlock');
      if (!staticBlock && owner === scope && bindingScope && chain.includes(bindingScope as Node)) {
        local = true;
      }
    });
    if (local) {
      return true;
    }
  }
  return false;
}

/** Accept only the reviewed Solid factory and direct, literal HTML inputs. */
export function inspectStaticTemplate(source: string): {
  line: number;
  column: number;
  calls: number;
} {
  const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'script', locations: true });
  const sinks: { node: Node; ancestors: Node[] }[] = [];
  const identifiers: { node: Node; ancestors: Node[] }[] = [];
  fullAncestor(ast, (value, _state, chain) => {
    const node = value as Node;
    const ancestors = [...chain] as Node[];
    if (node.type === 'Identifier') {
      identifiers.push({ node, ancestors });
    }
    if (node.type === 'AssignmentExpression') {
      const left = child(node, 'left');
      if (member(left, 'innerHTML') || member(left, 'outerHTML')) {
        sinks.push({ node, ancestors });
      }
    }
    if (node.type === 'CallExpression') {
      const callee = child(node, 'callee');
      if (
        member(callee, 'insertAdjacentHTML') ||
        member(callee, 'write') ||
        member(callee, 'writeln')
      ) {
        // A new HTML-writing call requires a fresh review, even if it is unrelated to Solid.
        throw new Error('Unreviewed HTML-writing call in Firefox content.js');
      }
    }
  });
  if (sinks.length !== 1 || !member(child(sinks[0]!.node, 'left'), 'innerHTML')) {
    throw new Error(`Expected exactly one reviewed innerHTML sink; found ${sinks.length}`);
  }
  const { node: sink, ancestors } = sinks[0]!;
  const left = child(sink, 'left');
  const html = child(sink, 'right');
  const factory = [...ancestors].reverse().find((item) => item.type === 'FunctionDeclaration');
  const factoryName = factory && child(factory, 'id');
  const params = factory?.params;
  const creator = [...ancestors].reverse().find((item) => item.type === 'ArrowFunctionExpression');
  if (
    sink.operator !== '=' ||
    name(child(left, 'object')) !== 't' ||
    !factory ||
    !factoryName ||
    !Array.isArray(params) ||
    name(params[0] as Node) !== name(html) ||
    name(html) !== 'html' ||
    !creator ||
    !Array.isArray(creator.params) ||
    creator.params.length !== 0 ||
    child(creator, 'body').type !== 'BlockStatement'
  ) {
    throw new Error('Unreviewed Solid template sink or parameter binding');
  }
  const declaration = identifiers.find((item) => item.node.start === factoryName.start);
  if (!declaration) {
    throw new Error('Solid template factory declaration is missing');
  }
  const factoryStatements = child(factory, 'body').body;
  const creatorStatements = child(creator, 'body').body;
  if (
    !Array.isArray(factoryStatements) ||
    !Array.isArray(creatorStatements) ||
    !creatorStatements.some(
      (statement) =>
        (statement as Node).type === 'ExpressionStatement' &&
        child(statement as Node, 'expression') === sink
    )
  ) {
    throw new Error('Solid template sink must be a direct statement in the creator');
  }
  const creatorDeclarations = factoryStatements.filter((statement) => {
    const item = statement as Node;
    return (
      item.type === 'VariableDeclaration' &&
      item.kind === 'const' &&
      Array.isArray(item.declarations) &&
      item.declarations.some((declaration) => child(declaration as Node, 'init') === creator)
    );
  });
  if (creatorDeclarations.length !== 1) {
    throw new Error('Solid template creator is not a direct factory const');
  }
  const templateDeclarations = creatorStatements
    .flatMap((statement) => {
      const item = statement as Node;
      return item.type === 'VariableDeclaration' && Array.isArray(item.declarations)
        ? item.declarations.map((declaration) => ({
            statement: item,
            declaration: declaration as Node,
          }))
        : [];
    })
    .filter(({ declaration }) => name(child(declaration, 'id')) === 't');
  const templateDeclaration = templateDeclarations[0];
  if (
    templateDeclarations.length !== 1 ||
    !templateDeclaration ||
    templateDeclaration.statement.kind !== 'const' ||
    templateDeclaration.declaration.start >= sink.start
  ) {
    throw new Error('Solid template sink receiver is not the direct template-element const');
  }
  const init = child(templateDeclaration.declaration, 'init');
  if (
    init.type !== 'ConditionalExpression' ||
    !templateElementCall(child(init, 'consequent'), 'createElementNS') ||
    !templateElementCall(child(init, 'alternate'), 'createElement')
  ) {
    throw new Error('Solid template sink receiver is not a template element');
  }
  const htmlReferences: number[] = [];
  let extraReceiverBinding = false;
  fullAncestor(factory, (value) => {
    const item = value as Node;
    if (name(item) === 'arguments') {
      throw new Error('Unreviewed arguments alias in Solid template factory');
    }
    if (name(item) === 'html') {
      htmlReferences.push(item.start);
    }
    if (
      item.type === 'VariableDeclarator' &&
      item !== templateDeclaration.declaration &&
      name(child(item, 'id')) === 't'
    ) {
      extraReceiverBinding = true;
    }
    if (item.type === 'AssignmentExpression' && name(child(item, 'left')) === 't') {
      extraReceiverBinding = true;
    }
  });
  if (
    htmlReferences.length !== 2 ||
    !htmlReferences.includes((params[0] as Node).start) ||
    !htmlReferences.includes(html.start) ||
    extraReceiverBinding
  ) {
    throw new Error('Solid template parameter or receiver binding was shadowed or rebound');
  }

  let calls = 0;
  for (const { node, ancestors: chain } of identifiers) {
    if (
      name(node) !== name(factoryName) ||
      node.start === factoryName.start ||
      shadowsFactory(chain, factory, name(factoryName)!)
    ) {
      continue;
    }
    const parent = chain.at(-2);
    if (
      !parent ||
      parent.type !== 'CallExpression' ||
      child(parent, 'callee').start !== node.start
    ) {
      throw new Error(
        `Solid template factory alias, escape, or shadowed reference requires review at ${node.start} (${parent?.type ?? 'none'})`
      );
    }
    const args = parent.arguments;
    const first = Array.isArray(args) ? (args[0] as Node | undefined) : undefined;
    if (
      !first ||
      (!(first.type === 'Literal' && typeof first.value === 'string') &&
        !(
          first.type === 'TemplateLiteral' &&
          Array.isArray(first.expressions) &&
          first.expressions.length === 0
        ))
    ) {
      throw new Error('Dynamic Solid template HTML input requires review');
    }
    calls++;
  }
  if (calls === 0) {
    throw new Error('Solid template factory has no direct calls');
  }
  const loc = sink.loc as { start: { line: number; column: number } };
  return { line: loc.start.line, column: loc.start.column + 1, calls };
}
