{
  description = "Shopflow OpenClaw fallback shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        packages.default = pkgs.buildGoModule {
          pname = "shopflow-openclaw-plugin";
          version = "0.1.1";
          src = ./.;
          vendorHash = null;
        };

        apps.default = flake-utils.lib.mkApp {
          drv = self.packages.${system}.default;
        };

        openclawPlugin = {
          name = "shopflow-read-only-packet";
          skills = [ ./skills/shopflow-read-only-packet ];
          packages = [ self.packages.${system}.default ];
          needs = {
            stateDirs = [ ];
            requiredEnv = [ ];
          };
        };
      }
    );
}
