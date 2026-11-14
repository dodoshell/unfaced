// The Remotion bundler turns imported asset files into URLs.
declare module "*.ttf" {
  const url: string;
  export default url;
}
