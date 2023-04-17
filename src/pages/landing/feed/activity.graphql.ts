import { gql } from '@apollo/client'

import { ProjectParametersForLandingPage } from '../projects/projects.graphql'

export enum ActivityResource {
  entry = 'Entry',
  project = 'Project',
  fundingTx = 'FundingTx',
  projectReward = 'ProjectReward',
}

export const FundingTxQueryParameterForLandingPage = `{
  id
  comment
  amount
  funder {
    id
    user {
      id
      username
      imageUrl
      externalAccounts {
        externalUsername
        public
        accountType
      }
    }
  }
  paidAt
  onChain
  media
  source
  method
  projectId
  sourceResource {
    ... on Project {
      id
      name
      title
      image
      thumbnailImage
    }
    ... on Entry {
      id
      image
      title
    }
  }
}`

export const EntryQueryParametersForLandingPage = `{
  amountFunded
  entryFundersCount: fundersCount
  entryDescription: description
  id
  image
  title
  project {
    id
    thumbnailImage
    title
  }
  creator {
    id
    imageUrl
    username
  }
}`

export const RewardQueryParametersForLandingPage = `{
  cost
  description
  id
  image
  rewardName: name
  sold
  stock
  rewardProject: project {
    id
    name
    title
    rewardCurrency
    owners {
      id
      user {
        id
        username
        imageUrl
      }
    }
  }
}`

export const QUERY_ACTIVITIES_FOR_LANDING_PAGE = gql`
  query GetActivities($input: GetActivitiesInput) {
    getActivities(input: $input) {
      id
      createdAt
      resource {
        ... on Entry ${EntryQueryParametersForLandingPage}
        ... on Project ${ProjectParametersForLandingPage}
        ... on FundingTx ${FundingTxQueryParameterForLandingPage}
        ... on ProjectReward ${RewardQueryParametersForLandingPage}
      }
    }
  }
`
// Re-mapping aliased keys to stick to Generated Types
export const MapAliasedActivityProperties = (rawActivities: any[]) => {
  const newActivities = rawActivities.map((activity) => {
    const newResource = { ...activity.resource }
    if (newResource.__typename === ActivityResource.entry) {
      newResource.fundersCount = newResource.entryFundersCount
      newResource.description = newResource.entrydescription
    }

    if (newResource.__typename === ActivityResource.projectReward) {
      newResource.name = newResource.rewardName
      newResource.project = newResource.rewardProject
    }

    return { ...activity, resource: newResource }
  })
  return newActivities
}