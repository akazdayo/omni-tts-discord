{
  description = "voice-clone-bot-select development environment";

  inputs = {
    git-hooks = {
      url = "github:cachix/git-hooks.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    nixpkgs.url = "nixpkgs";
    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    utils.url = "github:numtide/flake-utils";
  };
  outputs =
    {
      self,
      git-hooks,
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

        preCommitFmt = pkgs.writeShellApplication {
          name = "pre-commit-fmt";
          runtimeInputs = [ treefmtEval.config.build.wrapper ];
          text = ''
            exec ${pkgs.lib.getExe treefmtEval.config.build.wrapper} --no-cache -- "$@"
          '';
        };

        preCommitLint = pkgs.writeShellApplication {
          name = "pre-commit-lint";
          runtimeInputs = [ pkgs.bun ];
          text = ''
            exec bun lint
          '';
        };

        preCommitCheck = git-hooks.lib.${system}.run {
          src = ./.;
          hooks = {
            nix-fmt = {
              enable = true;
              name = "nix fmt";
              entry = pkgs.lib.getExe preCommitFmt;
              files = "\\.(js|jsx|ts|tsx|json|jsonc|nix|py)$";
            };
            lint = {
              enable = true;
              name = "bun lint";
              entry = pkgs.lib.getExe preCommitLint;
              files = "\\.(js|jsx|ts|tsx|json|jsonc)$";
              pass_filenames = false;
            };
          };
        };
      in
      {
        checks.pre-commit-check = preCommitCheck;

        devShells.default = pkgs.mkShell {
          inherit (preCommitCheck) shellHook;

          buildInputs =
            with pkgs;
            [
              bun
              nodejs_24
              treefmtEval.config.build.wrapper
              uv
              gleam
            ]
            ++ preCommitCheck.enabledPackages;
        };

        formatter = treefmtEval.config.build.wrapper;
      }
    );
}
