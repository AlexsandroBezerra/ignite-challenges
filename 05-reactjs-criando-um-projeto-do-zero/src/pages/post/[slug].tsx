/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import ptBR from 'date-fns/locale/pt-BR';

import { useMemo } from 'react';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const formattedPost = useMemo(() => {
    if (router.isFallback) {
      return null;
    }

    const WORDS_PER_MINUTE = 200;

    const text = post.data.content.reduce(
      (accumulator, currentValue) =>
        `${accumulator} ${currentValue.heading} ${RichText.asText(
          currentValue.body
        )}`,
      ''
    );

    const parsedContent = post.data.content.map(groupContent => ({
      heading: groupContent.heading,
      body: RichText.asHtml(groupContent.body),
    }));

    return {
      ...post,
      data: {
        ...post.data,
        parsedContent,
      },
      timeToRead: `${Math.ceil(text.split(' ').length / WORDS_PER_MINUTE)} min`,
      createdAt: format(new Date(post.first_publication_date), 'dd MMM yyyy', {
        locale: ptBR,
      }),
    };
  }, [post, router.isFallback]);

  if (router.isFallback) {
    return (
      <>
        <Head>
          <title>Carregando... | SpaceTraveling</title>
        </Head>

        <h2>Carregando...</h2>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{formattedPost.data.title} | SpaceTraveling</title>
      </Head>

      <Header />
      <img
        src={formattedPost.data.banner.url}
        alt={formattedPost.data.title}
        className={styles.banner}
      />

      <main className={`${commonStyles.mainContainer} ${styles.main}`}>
        <h1>{formattedPost.data.title}</h1>

        <div>
          <time>
            <FiCalendar size={20} />
            {formattedPost.createdAt}
          </time>

          <span>
            <FiUser size={20} />
            {formattedPost.data.author}
          </span>

          <time>
            <FiClock size={20} />
            {formattedPost.timeToRead}
          </time>
        </div>

        {formattedPost.data.parsedContent.map(group => (
          <article key={group.heading} className={styles.content}>
            <h2>{group.heading}</h2>
            <div dangerouslySetInnerHTML={{ __html: group.body }} />
          </article>
        ))}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at('document.type', 'post'),
    {
      fetch: ['title', 'author', 'subtitle'],
      pageSize: 2,
    }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    fallback: true,
    paths,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      content: response.data.content,
      banner: {
        url: response.data.banner.url,
      },
    },
    first_publication_date: response.first_publication_date,
  };

  const ONE_HOUR_IN_SECONDS = 60 * 60;

  return {
    revalidate: ONE_HOUR_IN_SECONDS,
    props: {
      post,
    },
  };
};
