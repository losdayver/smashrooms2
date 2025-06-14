const path = require("path");

module.exports = {
  entry: "./src/index.ts",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "..", "static", "scripts"),
  },
  resolve: {
    alias: {
      "@client": path.resolve(__dirname, "src"),
    },
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  devtool: "source-map",
  devServer: {
    static: "./dist",
    hot: true,
    port: 9000,
  },
};
