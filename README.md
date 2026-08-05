# pull-request-vir

GitHub Action for pull requests.

type docs: https://electrovir.github.io/pull-request-vir

## usage

1.  Install this package into whatever repo you're planning to use it.
    -   `npm i -D pull-request-vir`
2.  Create a config file somewhere in the repo (not within source code).

    1. The config file can be named anything but must be JavaScript or TypeScript.
    2. If using TypeScript, import the `Config` type into the config file.
    3. Create a config object that matches that type and export it as the default output:

        ```typescript
        import {type Config} from 'pull-request-vir';

        export const config: Config = {
            // see type definition for full config options
            assignToAuthor: true,
            blockNoMerge: true,
            reviewRules: [
                {
                    autoAdd: true,
                    users: [
                        'electrovir',
                        'another-user',
                        'ghost',
                    ],
                    required: 2,
                    codeOwners: {
                        paths: [/^src\/backend\//],
                    },
                },
                {
                    // always request this reviewer on pull requests assigned to 'junior-dev'
                    autoAdd: true,
                    users: ['senior-dev'],
                    required: 1,
                    appliesTo: ['junior-dev'],
                    // write 'senior-dev' into the description as the primary reviewer
                    isPrimary: true,
                },
            ],
        };
        ```

3.  Define a GitHub Actions workflow that uses `pull-request-vir`:

    ```yaml
    # recommended triggers
    on:
        pull_request_review:
            types: [submitted, dismissed]
        pull_request:
            types:
                [
                    opened,
                    reopened,
                    labeled,
                    edited,
                    ready_for_review,
                    review_requested,
                    review_request_removed,
                ]
    jobs:
        merge-checks:
            runs-on: ubuntu-latest
            steps:
                # pull-request-vir needs the repo checked out so it can read your config
                - uses: actions/checkout@v4.1.1
                - uses: electrovir/pull-request-vir@latest
                  with:
                      config_file: relative/path/to/config.ts
    ```

4.  Push to GitHub and watch the magic.
