/**
 * @fileoverview ESLint Custom Rule - No Internal Imports
 * @description @internal 주석이 있는 함수/변수의 외부 import를 금지하는 규칙
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow importing @internal marked functions/variables from outside their module',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noInternalImport: 'Cannot import "{{name}}" marked as @internal from "{{source}}"',
    },
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        const sourceValue = node.source.value;

        // Skip if importing from same module or barrel index
        if (sourceValue.includes('/index') || sourceValue.startsWith('.')) {
          return;
        }

        // Check if any imported specifiers are marked as @internal
        node.specifiers.forEach(specifier => {
          if (specifier.type === 'ImportSpecifier') {
            const importedName = specifier.imported.name;

            // TODO: Check if the imported function has @internal comment
            // This is a placeholder implementation
            if (importedName.includes('Internal') || importedName.startsWith('_')) {
              context.report({
                node: specifier,
                messageId: 'noInternalImport',
                data: {
                  name: importedName,
                  source: sourceValue,
                },
              });
            }
          }
        });
      },
    };
  },
};
