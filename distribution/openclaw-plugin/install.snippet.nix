# Public fallback install shape for the current OpenClaw customPlugins route.
programs.openclaw.instances.default = {
  enable = true;
  plugins = [
    { source = "github:xiaojiou176/shopflow-openclaw-plugin"; }
  ];
};
