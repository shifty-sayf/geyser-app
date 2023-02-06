import { useMutation, useQuery } from '@apollo/client'
import { GridItem, useDisclosure, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { BiPlus } from 'react-icons/bi'
import { useNavigate } from 'react-router'

import {
  DeleteConfirmModal,
  ProjectEntryCard,
  ProjectSectionBar,
} from '../../components/molecules'
import { ButtonComponent } from '../../components/ui'
import Loader from '../../components/ui/Loader'
import { getPath } from '../../constants'
import { QUERY_PROJECT_DASHBOARD_DATA } from '../../graphql'
import { MUTATION_DELETE_ENTRY } from '../../graphql/mutations'
import {
  Entry,
  Project,
  UniqueProjectQueryInput,
} from '../../types/generated/graphql'
import { toInt, useNotification } from '../../utils'

type ResponseData = {
  project: Project & {
    publishedEntries: Entry[]
    unpublishedEntries: Entry[]
  }
}

type QueryVariables = {
  where: UniqueProjectQueryInput
}

export const ProjectDashboardEntries = ({ project }: { project: Project }) => {
  const navigate = useNavigate()
  const { toast } = useNotification()

  const [liveEntries, setLiveEntries] = useState<Entry[]>([])
  const [draftEntries, setDraftEntries] = useState<Entry[]>([])

  const { loading } = useQuery<ResponseData, QueryVariables>(
    QUERY_PROJECT_DASHBOARD_DATA,
    {
      fetchPolicy: 'network-only',
      variables: { where: { id: toInt(project.id) } },
      onCompleted(data) {
        const live = data.project.publishedEntries
        const draft = data.project.unpublishedEntries

        setLiveEntries(live as Entry[])
        setDraftEntries(draft as Entry[])
      },
    },
  )

  const {
    isOpen: isDeleteEntryOpen,
    onClose: closeDeleteEntry,
    onOpen: openDeleteEntry,
  } = useDisclosure()

  const [deleteEntry] = useMutation(MUTATION_DELETE_ENTRY)

  const [selectedEntry, setSelectedEntry] = useState<Entry>()

  const handleCreateEntry = () => {
    navigate(getPath('projectEntryCreation', project.name))
  }

  const handleEntryEditButtonTapped = (entry: Entry) => {
    navigate(getPath('projectEntryDetails', project.name, entry.id))
  }

  const triggerDeleteEntry = (entry: Entry) => {
    setSelectedEntry(entry)
    openDeleteEntry()
  }

  const handleRemoveEntry = async () => {
    if (!selectedEntry || !selectedEntry.id) {
      return
    }

    try {
      await deleteEntry({
        variables: { deleteEntryId: toInt(selectedEntry.id) },
      })

      if (selectedEntry.published) {
        const newLive = liveEntries.filter(
          (entry) => entry.id !== selectedEntry.id,
        )
        setLiveEntries(newLive)
      } else {
        const newDraft = draftEntries.filter(
          (entry) => entry.id !== selectedEntry.id,
        )
        setDraftEntries(newDraft)
      }

      toast({
        title: 'Successfully removed entry',
        status: 'success',
      })
    } catch (error) {
      toast({
        title: 'Failed to remove entry',
        description: `${error}`,
        status: 'error',
      })
    }

    closeDeleteEntry()
  }

  if (loading) {
    return (
      <GridItem colSpan={6} display="flex" justifyContent="center">
        <Loader />
      </GridItem>
    )
  }

  return (
    <>
      <GridItem colSpan={6} display="flex" justifyContent="center">
        <VStack
          spacing="30px"
          width="100%"
          minWidth="350px"
          marginBottom="40px"
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <VStack w="100%" spacing="40px">
            <VStack w="100%" spacing="30px">
              <ProjectSectionBar
                name="Live"
                number={liveEntries && liveEntries.length}
              />
              <VStack w="100%">
                {liveEntries?.map((entry) => {
                  const entryWithProject = { ...entry, project }

                  return (
                    <ProjectEntryCard
                      key={entry.id}
                      entry={entryWithProject}
                      onEdit={() => handleEntryEditButtonTapped(entry)}
                      onDelete={() => triggerDeleteEntry(entry)}
                    />
                  )
                })}
              </VStack>
              <ButtonComponent w="full" onClick={handleCreateEntry}>
                <BiPlus style={{ marginRight: '10px' }} />
                Create a new Entry
              </ButtonComponent>
            </VStack>
            <VStack w="100%">
              <ProjectSectionBar
                name="Drafts"
                number={draftEntries && draftEntries.length}
              />

              <VStack>
                {draftEntries?.map((entry) => {
                  const entryWithProject = { ...entry, project }

                  return (
                    <ProjectEntryCard
                      key={entry.id}
                      entry={entryWithProject}
                      onEdit={() => handleEntryEditButtonTapped(entry)}
                      onDelete={() => triggerDeleteEntry(entry)}
                    />
                  )
                })}
              </VStack>
            </VStack>
          </VStack>
        </VStack>
      </GridItem>
      <GridItem colSpan={5} display="flex" justifyContent="center">
        <VStack
          justifyContent="center"
          alignItems="flex-start"
          maxWidth="370px"
          spacing="10px"
        ></VStack>
      </GridItem>
      <DeleteConfirmModal
        isOpen={isDeleteEntryOpen}
        onClose={closeDeleteEntry}
        title={`Delete reward ${selectedEntry?.title}`}
        description={'Are you sure you want to remove the entry'}
        confirm={handleRemoveEntry}
      />
    </>
  )
}