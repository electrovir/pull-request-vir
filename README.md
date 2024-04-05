# pull-request-vir

GitHub Action for pull requests.

type docs: https://electrovir.github.io/pull-request-vir

## usage

1.  install this package into whatever repo you're planning to use it
    -   `npm i pull-request-vir`
2.  create a config using that import

    1. the config file can be named anything but must be JavaScript or TypeScript
    2. import `definePullRequestVirConfig` into the config file
    3. export its output as the default output:

        ```typescript
        import {definePullRequestVirConfig} from 'pull-request-vir';

        export default definePullRequestVirConfig({
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
                    requiredIf: [/^src\/backend\//],
                },
            ],
        });
        ```

3.  create a GitHub Actions workflow that uses `pull-request-vir`:

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
                - uses: electrovir/pull-request-vir@latest
                with:
                    config_file: relative/path/to/config.ts
    ```

4.  push to GitHub and (hopefully) watch the magic
