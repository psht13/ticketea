import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	css: {
		postcss: { plugins: [] },
	},
	test: {
		environment: "node",
		coverage: {
			reporter: ["text", "lcov"],
		},
		reporters: ["default"],
		globals: true,
	},
}); 