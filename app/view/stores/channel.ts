/* eslint-disable class-methods-use-this */
import { makeAutoObservable } from 'mobx';
import Dayjs from 'dayjs';
import RSSParser from 'rss-parser';
import { dbInstance as db } from '../../model';
import { Article, Channel, RSSFeedItem } from '../../infra/types';
import { ArticleReadStatus } from '../../infra/constants/status';
import { channelRepo } from '../../repository/channel';
import { articleRepo } from '../../repository/article';

const parser = new RSSParser();

export class ChannelStore {
  feedUrl = '';

  currentChannel: Channel = {
    title: '',
    feedUrl: '',
    favicon: '',
    category: '',
    tag: '',
    createDate: '',
    updateDate: '',
    link: '',
    description: '',
  };

  currentArticle = {} as Article;

  channelList: Channel[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * 添加 feed url
   * @param {string} url feed url
   */
  async add(url: string): Promise<string> {
    this.feedUrl = url;

    const feed = await this.parseRSS();
    const { items } = feed;

    let result = '';

    delete feed.items;

    result = await channelRepo.addOne(feed);
    await channelRepo.insertFeedItems(feed.feedUrl, feed.title, items);

    return result;
  }

  setCurrentChannel(channel: Channel) {
    this.currentChannel = channel;
  }

  async getList() {
    const list = await channelRepo.getAll();

    this.channelList = list;

    return list;
  }

  async getArticleList(feedUrl: string) {
    const list = await articleRepo.getAllUnreadInChannel(feedUrl);

    return list;
  }

  async parseRSS(): Promise<Omit<Channel, 'id'>> {
    const feed = (await parser.parseURL(this.feedUrl)) as Omit<Channel, 'id'>;

    feed.category = '';
    feed.favicon = `${feed.link}/favicon.ico`;
    feed.tag = '';
    feed.createDate = new Date().toString();
    feed.createDate = new Date().toString();

    return feed;
  }

  setCurrentView(article: Article) {
    this.currentArticle = article;

    db.articles
      .where('link')
      .equals(article.link)
      .modify({ isRead: 1 })
      .then((a) => {
        console.log('isRead', a);
        return a;
      })
      .catch((e) => {
        console.log(e);
      });
  }
}