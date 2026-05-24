/**
 * apis
 * @author Perlou(perloukevin@gmail.com)
 */

import axios from 'axios'
import type { AxiosError } from 'axios'
import type { GitHubGraphqlVariables, GitHubRepository, NpmPackageDownloads, NpmPackageSearchResult } from './types.js'

axios.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        console.error('Fetch failed:', error.toJSON())
        return Promise.reject(error)
    }
)

// https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
export const fetchNPMPackages = async (npmUID: string): Promise<NpmPackageSearchResult[]> => {
    const response = await axios.get(`https://registry.npmjs.com/-/v1/search?text=maintainer:${npmUID}`)
    return response.data.objects
}

// https://github.com/npm/registry/blob/master/docs/download-counts.md
export const fetchNPMPackageDownloads = async (packageName: string): Promise<NpmPackageDownloads> => {
    const now = new Date()
    const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
    const response = await axios.get(`https://api.npmjs.org/downloads/point/2015-01-10:${today}/${packageName}`)
    return response.data
}

export const fetchGitHubUserinfo = async (githubUID: string): Promise<unknown> => {
    const response = await axios.get(`https://api.github.com/users/${githubUID}`)
    return response.data
}

export const fetchGitHubRepositories = async (githubUID: string): Promise<GitHubRepository[]> => {
    const response = await axios.get(`https://api.github.com/users/${githubUID}/repos?per_page=1000`)
    return response.data
}

export const fetchGitHubOrganizations = async (githubUID: string): Promise<unknown[]> => {
    const response = await axios.get(`https://api.github.com/users/${githubUID}/orgs`)
    return response.data
}

// https://docs.github.com/en/graphql/overview/explorer
// https://docs.github.com/en/graphql/reference/objects#user
export const fetchGitHubGraphql = async <T = unknown>(
    query: string,
    githubToken: string,
    variables: GitHubGraphqlVariables = {}
): Promise<T> => {
    const response = await axios({
        url: 'https://api.github.com/graphql',
        method: 'post',
        data: { query, variables },
        headers: {
            Authorization: `Bearer ${githubToken}`
        }
    })

    if (response.data.errors) {
        console.error(response.data.errors)
        throw new Error(response.data.errors.map((error: { message: string }) => error.message).join('; '))
    }

    return response.data.data.user
}
