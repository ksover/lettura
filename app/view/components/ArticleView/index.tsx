import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { observer } from 'mobx-react';
import { Icon } from '../Icon';
import { openBrowser } from '../../../infra/utils';
import { StoreContext, StoreType } from '../../stores';
import styles from './view.module.css';

function createMarkup(html: string) {
  return { __html: html };
}

export const ArticleView = observer(
  (): JSX.Element => {
    const { articleStore } = useContext(StoreContext) as StoreType;
    const { currentArticle } = useMemo(() => articleStore, []);
    const containerRef = useRef<HTMLDivElement>(null);

    const viewInBrowser = useCallback(() => {
      const { link } = currentArticle;
      openBrowser(link);
    }, [currentArticle]);

    const resetScrollTop = () => {
      if (containerRef.current !== null) {
        containerRef.current.scroll(0, 0);
      }
    };

    function renderPlaceholder() {
      return <div className={styles.placeholder} />;
    }

    const markArticleAsRead = useCallback(async () => {
      const result = await articleStore.markArticleAsRead(currentArticle.id);

      console.log('result', result);
    }, [currentArticle]);

    function renderDetail() {
      return (
        <React.Fragment key="detail">
          <div className={styles.toolbar}>
            <div className={`${styles.toolbarInner} ${styles.main}`}>
              <Icon
                name="done"
                customClass={styles.toolbarIcon}
                onClick={markArticleAsRead}
              />
              <Icon name="bookmark-border" customClass={styles.toolbarIcon} />
              <Icon name="favorite" customClass={styles.toolbarIcon} />
              <Icon
                name="open-in-new"
                customClass={styles.toolbarIcon}
                onClick={() => viewInBrowser()}
              />
            </div>
          </div>
          <div className={`${styles.main} ${styles.main}`}>
            <div className={styles.header}>
              <div className={styles.title}>{currentArticle.title}</div>
            </div>
            <div className={styles.body}>
              <div
                className={styles.content}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={createMarkup(currentArticle.content)}
              />
              <button
                type="button"
                className={styles.browserButton}
                onClick={() => {
                  viewInBrowser();
                }}
                aria-hidden="true"
              >
                查看网站
              </button>
            </div>
          </div>
        </React.Fragment>
      );
    }

    function handleGlobalClick(e: any) {
      if (e.target.nodeName.toLowerCase() === 'a' && e.target.href) {
        openBrowser(e.target.href);
        e.preventDefault();
      }
    }

    useEffect(() => {
      resetScrollTop();
    }, [currentArticle]);

    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
      <div
        className={styles.container}
        ref={containerRef}
        onClick={handleGlobalClick}
      >
        {currentArticle && currentArticle.id
          ? renderDetail()
          : renderPlaceholder()}
        {/* <iframe */}
        {/*  className={styles.frame} */}
        {/*  key="view" */}
        {/*  title="iframe" */}
        {/*  src={currentArticle.link} */}
        {/*  frameBorder="0" */}
        {/* /> */}
      </div>
    );
  }
);
