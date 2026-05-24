import assert from 'node:assert/strict'
import test from 'node:test'

import { getGitHubOwnerRepositories } from './data-github-private.js'
import type { GitHubGraphqlVariables } from './types.js'

const repository = (name: string) => ({
    name,
    languages: {
        edges: []
    }
})

test('fetches all owned public and private repository pages', async () => {
    const calls: GitHubGraphqlVariables[] = []
    const responses = new Map([
        [
            'PUBLIC:',
            {
                nodes: [repository('public-1')],
                pageInfo: {
                    hasNextPage: true,
                    endCursor: 'public-next'
                }
            }
        ],
        [
            'PUBLIC:public-next',
            {
                nodes: [repository('public-2')],
                pageInfo: {
                    hasNextPage: false,
                    endCursor: null
                }
            }
        ],
        [
            'PRIVATE:',
            {
                nodes: [repository('private-1')],
                pageInfo: {
                    hasNextPage: false,
                    endCursor: null
                }
            }
        ]
    ])

    const fetchGraphql = async (_query: string, _token: string, variables: GitHubGraphqlVariables) => {
        calls.push(variables)
        const repositories = responses.get(`${variables.privacy}:${variables.after || ''}`)
        assert.ok(repositories)
        return {
            repositories
        }
    }

    const result = await getGitHubOwnerRepositories({
        fetchGraphql,
        login: 'perlou',
        token: 'test-token'
    })

    assert.deepEqual(
        calls.map(({ privacy, after }) => ({ privacy, after })),
        [
            { privacy: 'PUBLIC', after: null },
            { privacy: 'PRIVATE', after: null },
            { privacy: 'PUBLIC', after: 'public-next' }
        ]
    )
    assert.deepEqual(result.counts, {
        public: 2,
        private: 1,
        total: 3
    })
    assert.deepEqual(
        result.repositories.map((item) => item.name),
        ['public-1', 'public-2', 'private-1']
    )
})
