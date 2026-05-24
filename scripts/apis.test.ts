import assert from 'node:assert/strict'
import test from 'node:test'

import { getGitHubAuthHeaders } from './apis.js'

test('builds GitHub authorization headers when a token is provided', () => {
    assert.deepEqual(getGitHubAuthHeaders('token-value'), {
        Authorization: 'Bearer token-value'
    })
})

test('omits GitHub authorization headers when no token is provided', () => {
    assert.deepEqual(getGitHubAuthHeaders(undefined), {})
})
