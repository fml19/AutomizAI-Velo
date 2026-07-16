import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const REQUIRED_CLIENT_ENV = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
] as const;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const missingEnv = REQUIRED_CLIENT_ENV.filter((name) => !env[name]?.trim());

  if (missingEnv.length > 0) {
    throw new Error(
      `Variaveis de ambiente obrigatorias ausentes: ${missingEnv.join(", ")}. ` +
        "Configure-as no ambiente de build antes de publicar a aplicacao.",
    );
  }

  try {
    new URL(env.VITE_SUPABASE_URL);
  } catch {
    throw new Error(
      "VITE_SUPABASE_URL invalida. Informe a URL completa do projeto Supabase.",
    );
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
