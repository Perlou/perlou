/**
 * github private data
 * @author Perlou(perloukevin@gmail.com)
 */

import { CONFIG, GITHUB_ACCESS_TOKEN } from './constants.js'
import { consoleObject } from './utils.js'
import { fetchGitHubGraphql } from './apis.js'
import type { GitHubGraphqlFetcher, Language } from './types.js'

type RepositoryPrivacy = 'PUBLIC' | 'PRIVATE'

interface PageInfo {
    hasNextPage: boolean
    endCursor: string | null
}

interface RepositoryLanguageEdge {
    size: number
    node: {
        name: string
        color: string | null
    }
}

interface RepositoryNode {
    name: string
    languages: {
        edges: RepositoryLanguageEdge[]
    }
}

interface RepositoryConnection {
    nodes: RepositoryNode[]
    pageInfo: PageInfo
}

interface RepositoryQueryResponse {
    repositories: RepositoryConnection
}

interface GitHubSponsor {
    login: string
    name: string | null
    url: string
    avatarUrl: string
    websiteUrl: string | null
}

interface SponsorActivity {
    action: 'NEW_SPONSORSHIP' | 'CANCELLED_SPONSORSHIP'
    sponsorsTier: {
        isOneTime: boolean
    }
    sponsor: GitHubSponsor | null
}

interface GitHubPrivateProfileData {
    sponsorsActivities: {
        nodes: SponsorActivity[]
    }
    sponsors: {
        totalCount: number
        edges: Array<{
            node: GitHubSponsor
        }>
    }
    contributionsCollection: {
        contributionCalendar: {
            totalContributions: number
            weeks: Array<{
                contributionDays: Array<{
                    weekday: number
                    date: string
                    contributionCount: number
                    color: string
                }>
            }>
        }
    }
}

interface RepositoryFetchOptions {
    fetchGraphql: GitHubGraphqlFetcher<RepositoryQueryResponse>
    login: string
    token: string
    privacy: RepositoryPrivacy
}

interface GitHubOwnerRepositoriesOptions {
    fetchGraphql?: GitHubGraphqlFetcher<RepositoryQueryResponse>
    login?: string
    token?: string
}

interface GitHubOwnerRepositoriesResult {
    repositories: RepositoryNode[]
    counts: {
        public: number
        private: number
        total: number
    }
}

interface LanguageStat {
    size: number
    color: string | null
    percentage?: string
}

// https://docs.github.com/en/graphql/reference/objects#sponsorsactivity
// https://docs.github.com/en/graphql/reference/enums#sponsorsactivityaction
const SPONSOR_NODE_QUERY = `
  ... on User {
    login
    name
    url
    avatarUrl
    websiteUrl
  }
  ... on Organization {
    login
    name
    url
    avatarUrl
    websiteUrl
  }
`

const USER_PROFILE_QUERY = `
  query($login: String!) {
    user(login: $login) {
      sponsorsActivities(first:100, period: ALL, orderBy: { direction: DESC, field: TIMESTAMP }, actions: [NEW_SPONSORSHIP, CANCELLED_SPONSORSHIP]) {
        nodes {
          action,
          sponsorsTier {
            isOneTime
          },
          sponsor {
            ${SPONSOR_NODE_QUERY}
          }
        }
      },
      sponsors(first: 100) {
        totalCount
        edges {
          node {
            ${SPONSOR_NODE_QUERY}
          }
        }
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              weekday
              date
              contributionCount
              color
            }
          }
        }
      }
    }
  }
`

const REPOSITORIES_QUERY = `
  query($login: String!, $privacy: RepositoryPrivacy!, $after: String) {
    user(login: $login) {
      repositories(
        first: 100
        after: $after
        privacy: $privacy
        isFork: false
        ownerAffiliations: OWNER
        orderBy: {field: CREATED_AT, direction: DESC}
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          name
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
      }
    }
  }
`

const requireGitHubToken = (token: string | undefined): string => {
    if (!token) {
        throw new Error('Missing GitHub token. Set PROFILE_GITHUB_TOKEN to a PAT that can read private repositories.')
    }
    return token
}

const fetchRepositoriesByPrivacy = async ({
    fetchGraphql,
    login,
    token,
    privacy
}: RepositoryFetchOptions): Promise<RepositoryNode[]> => {
    const repositories: RepositoryNode[] = []
    let after = null
    let hasNextPage = true

    while (hasNextPage) {
        const data = await fetchGraphql(REPOSITORIES_QUERY, token, {
            login,
            privacy,
            after
        })

        repositories.push(...data.repositories.nodes)
        hasNextPage = data.repositories.pageInfo.hasNextPage
        after = data.repositories.pageInfo.endCursor
    }

    return repositories
}

export const getGitHubOwnerRepositories = async ({
    fetchGraphql = fetchGitHubGraphql,
    login = CONFIG.GITHUB_UID,
    token = GITHUB_ACCESS_TOKEN
}: GitHubOwnerRepositoriesOptions = {}): Promise<GitHubOwnerRepositoriesResult> => {
    const githubToken = requireGitHubToken(token)
    const [publicRepositories, privateRepositories] = await Promise.all([
        fetchRepositoriesByPrivacy({
            fetchGraphql,
            login,
            token: githubToken,
            privacy: 'PUBLIC'
        }),
        fetchRepositoriesByPrivacy({
            fetchGraphql,
            login,
            token: githubToken,
            privacy: 'PRIVATE'
        })
    ])
    const repositories = [...publicRepositories, ...privateRepositories]

    return {
        repositories,
        counts: {
            public: publicRepositories.length,
            private: privateRepositories.length,
            total: repositories.length
        }
    }
}

export const getGitHubPrivateData = async () => {
    const githubToken = requireGitHubToken(GITHUB_ACCESS_TOKEN)
    const [graphqlPrivateData, repositoryData] = await Promise.all([
        fetchGitHubGraphql<GitHubPrivateProfileData>(USER_PROFILE_QUERY, githubToken, { login: CONFIG.GITHUB_UID }),
        getGitHubOwnerRepositories({ token: githubToken })
    ])
    console.group(`[GitHub Private]`)

    // ---------------------------------------------------------------
    // contributions (default: last year)
    const contributions = graphqlPrivateData.contributionsCollection.contributionCalendar
    console.log('last year totalContributions:', contributions.totalContributions)

    // ---------------------------------------------------------------
    // languages statistics
    const languages: Language[] = []
    let totalSize = 0
    const languageStats: Record<string, LanguageStat> = {}
    consoleObject('repositories:', repositoryData.counts)
    repositoryData.repositories.forEach((repo) => {
        repo.languages.edges.forEach((edge) => {
            const langSize = edge.size
            const langName = edge.node.name
            const langColor = edge.node.color
            totalSize += langSize
            if (languageStats[langName]) {
                languageStats[langName].size += langSize
            } else {
                languageStats[langName] = {
                    size: langSize,
                    color: langColor
                }
            }
        })
    })

    for (const [lang, item] of Object.entries(languageStats)) {
        item.percentage = Number((item.size / totalSize) * 100).toFixed(2)
        languages.push({ name: lang, size: item.size, color: item.color, percentage: item.percentage })
    }

    // sort languages by size
    languages.sort((a, b) => b.size - a.size)
    console.log('total languages:', languages.length)

    // ---------------------------------------------------------------
    // sponsors
    const pastSponsors: GitHubSponsor[] = []
    const currentSponsors = graphqlPrivateData.sponsors.edges.map((edge) => edge.node) || []
    const currentSponsorsLogins = currentSponsors.map((item) => item.login)
    // 1. order by TIMESTAMP/DESC
    // 2. filter out current sponsors
    // 3. the latest user to cancel is at the head of the array
    // 4. no cancellation events for one-time sponsor
    graphqlPrivateData.sponsorsActivities.nodes.forEach((node) => {
        // Recently, GitHub returned the Ghost user as null
        if (!node.sponsor || node.sponsor.login === 'ghost') {
            return
        }

        if (node.action === 'CANCELLED_SPONSORSHIP' || node.sponsorsTier.isOneTime) {
            if (!currentSponsorsLogins.includes(node.sponsor.login)) {
                pastSponsors.push(node.sponsor)
            }
        }
    })

    consoleObject('sponsors:', {
        totalCount: graphqlPrivateData.sponsors.totalCount,
        currentSponsors: currentSponsors.length,
        pastSponsors: pastSponsors.length
    })

    console.groupEnd()

    return {
        contributions,
        languages,
        sponsors: {
            totalCount: graphqlPrivateData.sponsors.totalCount,
            currentSponsors,
            pastSponsors
        }
    }
}
