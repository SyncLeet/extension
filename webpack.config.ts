import "dotenv/config";
import { resolve } from "path";
import { Configuration } from "webpack";
import { EnvironmentPlugin } from "webpack";
import CopyPlugin from "copy-webpack-plugin";

const srcDir = resolve(__dirname, "src");
const distDir = resolve(__dirname, "dist");
const publicDir = resolve(__dirname, "public");

const config: Configuration = {
  mode: "production",
  entry: {
    foreground: resolve(srcDir, "foreground.ts"),
    background: resolve(srcDir, "background.ts"),
    popup: resolve(srcDir, "popup.ts"),
  },
  output: {
    path: distDir,
    filename: "scripts/[name].js",
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      src: srcDir,
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new EnvironmentPlugin({
      CLIENT_ID: JSON.stringify(process.env.CLIENT_ID),
      CLIENT_SECRET: JSON.stringify(process.env.CLIENT_SECRET),
    }),
    new CopyPlugin({
      patterns: [{ from: publicDir, to: distDir }],
    }),
  ],
};

export default config;
