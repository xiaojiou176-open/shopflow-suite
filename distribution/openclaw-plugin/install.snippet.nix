# Public fallback install shape for OpenClaw customPlugins.
programs.openclaw.instances.default = {
  enable = true;
  plugins = [
    { source = "github:<authorized-namespace>/shopflow-openclaw-plugin"; }
  ];
};
