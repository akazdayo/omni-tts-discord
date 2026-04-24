{
  inputs = {
    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    utils.url = "github:numtide/flake-utils";
  };
  outputs =
    {
      self,
      nixpkgs,
      treefmt-nix,
      utils,
    }:
    utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        treefmtEval = treefmt-nix.lib.evalModule pkgs {
          projectRootFile = "flake.nix";

          programs = {
            gleam.enable = true;
            nixfmt.enable = true;
            ruff-format.enable = true;
          };

          settings = {
            formatter.vp = {
              command = pkgs.writeShellApplication {
                name = "vp-fmt";
                runtimeInputs = [ pkgs.bun ];
                text = ''
                  exec bunx --bun vp fmt "$@"
                '';
              };
              includes = [
                "*.js"
                "*.jsx"
                "*.ts"
                "*.tsx"
                "*.json"
                "*.jsonc"
              ];
            };

            global.excludes = [
              ".direnv/**"
              ".venv/**"
              "node_modules/**"
              "voices/**"
            ];
          };
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bun
            nodejs_24
            treefmtEval.config.build.wrapper
            uv
            gleam
          ];
        };

        formatter = treefmtEval.config.build.wrapper;
      }
    );
}
