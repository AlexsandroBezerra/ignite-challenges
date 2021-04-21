import Head from 'next/head';
import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useCallback, useMemo, useState } from 'react';

import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const formattedPosts = useMemo(() => {
    return posts.map(post => ({
      slug: post.uid,
      title: post.data.title,
      subtitle: post.data.subtitle,
      updatedAt: format(new Date(post.first_publication_date), 'dd MMM yyyy', {
        locale: ptBR,
      }),
      author: post.data.author,
    }));
  }, [posts]);

  const handleLoadMorePosts = useCallback(async () => {
    const response = await fetch(nextPage);
    const parsedResponse = await response.json();

    setNextPage(parsedResponse.next_page);
    setPosts(state => [...state, ...parsedResponse.results]);
  }, [nextPage]);

  return (
    <>
      <Head>
        <title>Início | SpaceTraveling</title>
      </Head>

      <Header />

      <main className={commonStyles.mainContainer}>
        {formattedPosts.map(post => (
          <Link href={`/post/${post.slug}`} key={post.slug}>
            <a className={styles.postLink}>
              <h2>{post.title}</h2>
              <p>{post.subtitle}</p>
              <div>
                <time>
                  <FiCalendar size={20} />
                  {post.updatedAt}
                </time>

                <span>
                  <FiUser size={20} />
                  {post.author}
                </span>
              </div>
            </a>
          </Link>
        ))}

        {nextPage && (
          <button
            type="button"
            onClick={handleLoadMorePosts}
            className={styles.loadPostsButton}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'post'),
    {
      fetch: ['title', 'author', 'subtitle'],
      pageSize: 2,
    }
  );

  const HALF_HOUR_IN_SECONDS = 60 * 30;

  return {
    revalidate: HALF_HOUR_IN_SECONDS,
    props: {
      postsPagination: {
        results: postsResponse.results,
        next_page: postsResponse.next_page,
      },
    },
  };
};
