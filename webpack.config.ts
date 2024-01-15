import path from "path";
import webpack from "webpack";
import CopyPlugin from "copy-webpack-plugin";

const config: webpack.Configuration = {
  mode: "production",
  entry: {
    foreground: path.resolve(__dirname, "src/foreground.ts"),
    background: path.resolve(__dirname, "src/background.ts"),
  },
  output: {
    path: path.resolve(__dirname, "dist"),
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
    new CopyPlugin({
      patterns: [{ from: "public/manifest.json", to: "manifest.json" }],
    }),
  ],
};

export default config;
