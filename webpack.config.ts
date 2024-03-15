import path from "path";
import webpack from "webpack";
import CopyPlugin from "copy-webpack-plugin";
import { DefinePlugin } from "webpack";

const sourceFolder = path.resolve(__dirname, "src");
const publicFolder = path.resolve(__dirname, "public");
const buildFolder = path.resolve(__dirname, "dist");

const config: webpack.Configuration = {
  mode: "production",
  entry: {
    foreground: path.resolve(sourceFolder, "foreground.ts"),
    background: path.resolve(sourceFolder, "background.ts"),
    popup: path.resolve(sourceFolder, "popup.ts"),
  },
  output: {
    filename: "script/[name].js",
    path: buildFolder,
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".js"],
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
    new DefinePlugin({
      "process.env": {
        CLIENT_ID: JSON.stringify(process.env.CLIENT_ID),
        CLIENT_SECRET: JSON.stringify(process.env.CLIENT_SECRET),
      },
    }),
    new CopyPlugin({
      patterns: [{ from: publicFolder, to: buildFolder }],
    }),
  ],
};

export default config;
