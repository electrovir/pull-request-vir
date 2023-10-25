import type {ArrayElement} from '@augment-vir/common';
import {components} from '@octokit/openapi-types';

export type GitHubActionsEventTriggerName = ArrayElement<
    NonNullable<
        /**
         * These types aren't individually exported anywhere so we have to extract them from this
         * location.
         */
        components['schemas']['webhook-check-suite-completed']['check_suite']['app']['events']
    >
>;
