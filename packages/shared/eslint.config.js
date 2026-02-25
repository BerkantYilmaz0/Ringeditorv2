export default [
    {
        ignores: ["dist/**", "node_modules/**"]
    },
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parser: (await import('@typescript-eslint/parser')).default,
        }
    }
];
