# 🤖 AI Agent Manual: Public Deployment & GitHub Pages Standards

This document is a mandatory system guide for all AI coding assistants operating on this repository. Follow these precise steps when preparing, modifying, or creating React/Vite applications for public GitHub Pages deployment.

---

## 🧭 1. Routing & Base Path Constraint
By default, GitHub Pages hosts repositories in subdirectories (e.g., `https://username.github.io/repository-name/`).
- ** VITE_CONFIG_RULE**: Always configure the `base` property in `vite.config.ts` to use relative paths. This ensures asset resolution succeeds under subdirectories.
  ```typescript
  // vite.config.ts
  export default defineConfig(() => {
    return {
      base: './', // CRITICAL: Ensures relative asset loading
      // ... rest of the config
    };
  });
  ```

---

## 🛠️ 2. Automated Deployment Workflow
Always preserve the `.github/workflows/ci.yml` file to enable Zero-Configuration GitHub Pages deployment via GitHub Actions.

- **Workflow Requirements**:
  - **Node Version**: Use Node 22 (modern stable).
  - **No Lock-File Lockouts**: Use `npm install` instead of `npm ci` to handle potential lock-file mismatches smoothly in containerized environments.
  - **Security Permissions**: The runner must explicitly declare permissions to write pages and sign tokens:
    ```yaml
    permissions:
      contents: read
      pages: write
      id-token: write
    ```
  - **Environment Targeting**: Target the `github-pages` environment and deploy the `./dist` folder using the standard Actions:
    - `actions/upload-pages-artifact@v3`
    - `actions/deploy-pages@v4`

---

## 🎨 3. Visual Identity & Assets (Favicons & Logos)
When deploying a public app, never leave default template icons in place.
- **Checklist**:
  - [ ] **Favicon Integration**: Update `index.html` to load a custom favicon tailored to the app (e.g., `<link rel="icon" type="image/svg+xml" href="./favicon.svg" />` or a relevant image file).
  - [ ] **Metadata Titles**: Ensure `<title>` in `index.html` matches the descriptive, literal name defined in `metadata.json`.
  - [ ] **Asset Preservation**: Do not delete visual elements, logos, or styles defined in the `src/` or `public/` directories without replacement.

---

## 📝 4. Development Operations Checklist
Before completing work on a deployment-related task:
1. **Linter Validation**: Always execute `npm run lint` (`tsc --noEmit`) to verify zero TypeScript errors.
2. **Build Success**: Verify that `npm run build` succeeds locally, ensuring the compiled static output builds in `dist/` with relative reference directories.
