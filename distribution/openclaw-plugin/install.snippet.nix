# Canonical OpenClaw install shape from the Shopflow repo subdir.
programs.openclaw.instances.default = {
  enable = true;
  plugins = [
    { source = "github:xiaojiou176-open/shopflow-suite?dir=distribution/openclaw-plugin"; }
  ];
};
