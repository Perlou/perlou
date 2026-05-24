export type GitHubGraphqlVariables = Record<string, unknown>

export type GitHubGraphqlFetcher<T> = (
    query: string,
    githubToken: string,
    variables: GitHubGraphqlVariables
) => Promise<T>

export interface GitHubRepository {
    stargazers_count: number
    forks_count: number
    open_issues: number
    fork: boolean
    owner: {
        login: string
    }
    size: number
    topics: string[]
}

export interface NpmPackageSearchResult {
    package: {
        name: string
    }
}

export interface NpmPackageDownloads {
    downloads?: number
}

export interface Language {
    name: string
    size: number
    color: string | null
    percentage: string
}
