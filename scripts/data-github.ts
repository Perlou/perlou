/**
 * github data
 * @author Perlou(perloukevin@gmail.com)
 */

import { CONFIG, GITHUB_ACCESS_TOKEN } from './constants.js'
import { consoleObject } from './utils.js'
import { fetchGitHubUserinfo, fetchGitHubRepositories, fetchGitHubOrganizations } from './apis.js'

interface GitHubPublicStatistics {
    size: number
    stars: number
    forks: number
    open_issues: number
    topics: Record<string, number>
}

export const getGitHubPublicData = async () => {
    const [userinfo, repositories, organizations] = await Promise.all([
        fetchGitHubUserinfo(CONFIG.GITHUB_UID, GITHUB_ACCESS_TOKEN),
        fetchGitHubRepositories(CONFIG.GITHUB_UID, GITHUB_ACCESS_TOKEN),
        fetchGitHubOrganizations(CONFIG.GITHUB_UID, GITHUB_ACCESS_TOKEN)
    ])

    console.group(`[GitHub Public]`)
    consoleObject('counts:', {
        repositories: repositories.length,
        organizations: organizations.length
    })

    // statistics
    const statistics: GitHubPublicStatistics = {
        size: 0,
        stars: 0,
        forks: 0,
        open_issues: 0,
        topics: {}
    }

    // basic statistics
    repositories.forEach((repository) => {
        statistics.stars += repository.stargazers_count
        statistics.forks += repository.forks_count
        statistics.open_issues += repository.open_issues
        // owner only
        if (!repository.fork && repository.owner.login === CONFIG.GITHUB_UID) {
            statistics.size += repository.size
            repository.topics.forEach((topic) => {
                statistics.topics[topic] = statistics.topics[topic] || 0
                statistics.topics[topic] += 1
            })
        }
    })

    consoleObject('statistics:', statistics)
    console.groupEnd()

    return {
        userinfo,
        statistics,
        repositories,
        organizations
    }
}
