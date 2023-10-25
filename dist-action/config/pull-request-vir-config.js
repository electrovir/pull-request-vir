"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultPullRequestVirConfig = exports.pullRequestVirConfigShape = void 0;
const object_shape_tester_1 = require("object-shape-tester");
/** Shape definition for verifying a config's validity. */
exports.pullRequestVirConfigShape = (0, object_shape_tester_1.defineShape)({
    applyFormatting: (0, object_shape_tester_1.or)(undefined, {
        command: '',
    }),
});
/** Default value for config type expected by pull-request-vir. */
exports.defaultPullRequestVirConfig = exports.pullRequestVirConfigShape.defaultValue;
