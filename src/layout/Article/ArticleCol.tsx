import React, { useImperativeHandle, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ArticleList } from "@/components/ArticleList";
import { useBearStore } from "@/stores";
import { CheckCheck, RotateCw, Rss, Link } from "lucide-react";
import { useArticle } from "./useArticle";
import { loadFeed } from "@/hooks/useLoadFeed";
import { ArticleReadStatus } from "@/typing";
import { useHotkeys } from "react-hotkeys-hook";
import { throttle } from "lodash";
import { ArticleResItem } from "@/db";
import { Avatar, HoverCard, IconButton, Select, Tooltip } from "@radix-ui/themes";
import { getFeedLogo } from "@/helpers/parseXML";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import i18next from "i18next";

export interface ArticleColRefObject {
  goNext: () => void;
  goPrev: () => void;
}

export const ArticleCol = React.memo(
  React.forwardRef<ArticleColRefObject, any>((props: { feedUuid?: string; type?: string }, listForwarded) => {
    const { t } = useTranslation();
    const { feedUuid, type } = props;
    // @ts-ignore
    const params: { name: string } = useParams();
    const [isSyncing, setIsSyncing] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);

    const store = useBearStore(useShallow((state) => ({
      viewMeta: state.viewMeta,
      article: state.article,
      setArticle: state.setArticle,
      feed: state.feed,
      syncArticles: state.syncArticles,
      markArticleListAsRead: state.markArticleListAsRead,

      updateArticleStatus: state.updateArticleStatus,
      setHasMorePrev: state.setHasMorePrev,
      setHasMoreNext: state.setHasMoreNext,

      currentFilter: state.currentFilter,
      setFilter: state.setFilter,

      userConfig: state.userConfig,
    })));

    const { articles, isLoading, size, mutate, setSize, isEmpty, isReachingEnd, isToday, isAll, isStarred } =
      useArticle({
        feedUuid,
        type,
      });
    const filterList = useMemo(() => [
      {
        id: 0,
        title: i18next.t("All articles"),
      },
      {
        id: 1,
        title: i18next.t("Unread"),
      },
      {
        id: 2,
        title: i18next.t("Read"),
      },
    ], []);
    const handleRefresh = () => {
      if (store.feed && store.feed.uuid) {
        setIsSyncing(true);
        loadFeed(
          store.feed,
          store.syncArticles,
          () => {
            mutate();
            setIsSyncing(false);
          },
          () => {
            setIsSyncing(false);
          }
        );
      }
    };

    const handleUnsubscribeFeed = () => {};

    const markAllRead = () => {
      return store.markArticleListAsRead(isToday, isAll).then(() => {
        mutate();
      });
    };

    const changeFilter = (id: any) => {
      if (filterList.some((_) => _.id === parseInt(id, 10))) {
        store.setFilter({
          ...filterList.filter((_) => _.id === parseInt(id, 10))[0],
        });
      }
    };

    function calculateItemPosition(direction: "up" | "down", article: ArticleResItem | null) {
      if (!article?.uuid) {
        return;
      }

      const $li = document.getElementById(article.uuid);
      const bounding = $li?.getBoundingClientRect();
      const winH = window.innerHeight;

      if ((direction === "up" || direction === "down") && bounding && bounding.top < 58) {
        const offset = 58 - bounding.top;
        const scrollTop = (listRef?.current?.scrollTop || 0) - offset;

        listRef?.current?.scrollTo(0, scrollTop);
      } else if ((direction === "up" || direction === "down") && bounding && bounding.bottom > winH) {
        const offset = bounding.bottom - winH;
        const scrollTop = (listRef?.current?.scrollTop || 0) + offset;

        console.log("🚀 ~ file: index.tsx:324 ~ ArticleContainer ~ scrollTop:", scrollTop);
        listRef?.current?.scrollTo(0, scrollTop);
      }
    }

    const goPreviousArticle = () => {
      let previousItem: ArticleResItem;
      let uuid = store.article?.uuid;

      for (let i = 0; i < articles.length; i++) {
        if (articles[i].uuid === uuid && i === 0) {
          store.setHasMorePrev(false);
          store.setHasMoreNext(true);

          break;
        }

        if (articles[i].uuid === uuid && i !== 0) {
          previousItem = articles[i - 1];
          previousItem.read_status = ArticleReadStatus.READ;

          store.updateArticleStatus({ ...previousItem }, ArticleReadStatus.READ);
          store.setArticle(previousItem);
          store.setHasMorePrev(true);
          store.setHasMoreNext(true);

          calculateItemPosition("up", previousItem);

          break;
        }
      }
    };

    const goNextArticle = () => {
      let nextItem: ArticleResItem = {} as ArticleResItem;
      let uuid = store.article?.uuid;

      if (!uuid) {
        return [false];
      }

      for (let i = 0; i < articles.length; i++) {
        if (articles[i].uuid === uuid && i === articles.length) {
          return [true];
        }

        if (articles[i].uuid === uuid && i < articles.length - 1) {
          nextItem = articles[i + 1];
          break;
        }
      }

      if (!uuid && articles.length > 0) {
        nextItem = articles[0];
      }

      store.updateArticleStatus({ ...nextItem }, ArticleReadStatus.READ);

      nextItem.read_status = ArticleReadStatus.READ;
      store.setArticle(nextItem);

      calculateItemPosition("down", nextItem);

      return [false];
    };

    const goPrev = throttle(() => {
      console.warn("goPrev");
      goPreviousArticle();
    }, 300);

    const goNext = throttle(() => {
      console.warn("goNext");
      const [shouldLoad] = goNextArticle();
      console.log("%c Line:111 🍏 shouldLoad", "color:#42b983", shouldLoad);

      if (shouldLoad) {
        // getList({ cursor: store.cursor + 1 });
      }
    }, 300);

    function renderLabel() {
      if (store.feed && store.feed.item_type === "channel") {
        const ico = store.feed.logo || getFeedLogo(store.feed.link);
        return (
          <HoverCard.Root>
            <HoverCard.Trigger>
              <span className="cursor-default">{store.viewMeta ? store.viewMeta.title : ""}</span>
            </HoverCard.Trigger>
            <HoverCard.Content size="1" className="p-3 w-[320px] flex gap-3 flex-row">
              <Avatar size="4" src={ico} fallback={store.feed.title.slice(0, 1)}></Avatar>
              <div className="flex-1 flex flex-col gap-1">
                <div className="text-sm font-bold">{store.viewMeta ? store.viewMeta.title : ""}</div>
                <div className="text-xs text-[var(--gray-11)] break-all">{store.feed.description}</div>
                <div className="flex gap-4 mt-2">
                  <IconButton size="2" variant="ghost" color="gray">
                    <Link size={14} onClick={() => window.open(store.feed?.link, "_blank")} />
                    <span className="ml-1 text-xs">Home</span>
                  </IconButton>
                  <IconButton size="2" variant="ghost" color="gray">
                    <Rss size={14} onClick={() => window.open(store.feed?.feed_url, "_blank")} />
                    <span className="ml-1 text-xs">Feed</span>
                  </IconButton>
                </div>
              </div>
            </HoverCard.Content>
          </HoverCard.Root>
        );
      } else {
        return <span className="cursor-default">{store.viewMeta ? store.viewMeta.title : ""}</span>;
      }
    }

    useImperativeHandle(listForwarded, () => {
      return {
        goNext,
        goPrev,
      };
    });

    useHotkeys("n", goNext);
    useHotkeys("Shift+n", goPrev);

    return (
      <div className="shrink-0 grow-0 w-[var(--app-article-width)] border-r flex flex-col h-full">
        <div className="h-[var(--app-toolbar-height)] grid grid-cols-[auto_1fr] items-center justify-between border-b">
          <div
            className="
            flex-shrink-0
            flex-grow-0
            pl-3
            text-base
            font-bold
            w-full
            text-ellipsis
            overflow-hidden
            whitespace-nowrap
            text-article-headline
          "
          >
            {renderLabel()}
          </div>
          <div className={"flex items-center justify-end px-2 gap-x-3"}>
            <Select.Root defaultValue={`${store.currentFilter.id}`} onValueChange={changeFilter} size="1">
              <Select.Trigger variant="surface" color="gray" className="hover:bg-[var(--accent-a3)]" />
              <Select.Content>
                {filterList.map((item) => {
                  return (
                    <Select.Item key={`${item.id}`} value={`${item.id}`}>
                      {item.title}
                    </Select.Item>
                  );
                })}
              </Select.Content>
            </Select.Root>
            <Tooltip content={t("Mark all as read")}>
              <IconButton onClick={markAllRead} size="2" variant="ghost" color="gray" className="text-[var(--gray-12)]">
                <CheckCheck size={14} />
              </IconButton>
            </Tooltip>
            {!!!isStarred && (
              <Tooltip content={t("Reload feeds")}>
                <IconButton
                  onClick={handleRefresh}
                  size="2"
                  variant="ghost"
                  color="gray"
                  className="text-[var(--gray-12)]"
                  loading={isSyncing}
                >
                  <RotateCw size={14} />
                </IconButton>
              </Tooltip>
            )}
          </div>
        </div>
        <div className="relative flex-1 overflow-auto scrollbar-gutter" ref={listRef}>
          <ArticleList
            articles={articles}
            title={params.name}
            type={type}
            feedUuid={feedUuid}
            isLoading={isLoading}
            isEmpty={isEmpty}
            isReachingEnd={isReachingEnd}
            size={size}
            setSize={setSize}
          />
        </div>
      </div>
    );
  })
);
