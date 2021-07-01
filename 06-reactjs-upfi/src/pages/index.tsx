import { Button, Box } from '@chakra-ui/react';
import { useMemo } from 'react';
import { useInfiniteQuery } from 'react-query';

import { Header } from '../components/Header';
import { CardList } from '../components/CardList';
import { api } from '../services/api';
import { Loading } from '../components/Loading';
import { Error } from '../components/Error';

type Card = {
  title: string;
  description: string;
  url: string;
  ts: number;
  id: string;
};

type ApiResponse = {
  after: string;
  data: Card[];
};

export default function Home(): JSX.Element {
  const fetchImages = async ({ pageParam = null }): Promise<ApiResponse> => {
    const response = await api.get('api/images', {
      params: {
        after: pageParam,
      },
    });

    return response.data;
  };

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery('images', fetchImages, {
    getNextPageParam: lastPage => lastPage.after || null,
  });

  async function loadImages(): Promise<void> {
    await fetchNextPage();
  }

  const formattedData = useMemo(() => {
    return data?.pages.reduce(
      (accumulator, currentPage) => [...accumulator, ...currentPage.data],
      []
    );
  }, [data]);

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error />;
  }

  return (
    <>
      <Header />

      <Box maxW={1120} px={20} mx="auto" my={20}>
        <CardList cards={formattedData} />
        {hasNextPage && (
          <Button mt="8" isLoading={isFetchingNextPage} onClick={loadImages}>
            Carregar mais
          </Button>
        )}
      </Box>
    </>
  );
}
