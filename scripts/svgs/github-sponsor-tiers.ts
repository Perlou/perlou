interface GitHubSponsorTiersOptions {
    width: number
}

const defaultOptions: GitHubSponsorTiersOptions = {
    width: 830
}

export const renderGitHubSponsorTiers = (options: Partial<GitHubSponsorTiersOptions> = {}): string => {
    const opts = { ...defaultOptions, ...options }
    // TODO
    return ''
}
