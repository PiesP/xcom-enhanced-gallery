type CssModuleClasses = Readonly<Record<string, string>>;

declare module '*.module.css' {
  const classes: CssModuleClasses;
  export default classes;
}

declare module '*.css' {
  const stylesheet: string;
  export default stylesheet;
}
