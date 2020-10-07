import React from 'react';
import * as routesConfig from '../../../infra/constants/routes';
import { Icon } from '../Icon';
import styles from './channel.module.css';
import { Channel as IChannel } from '../../../infra/types';

export interface Props {
  channels: IChannel[];
}

function Channel(props: Props): JSX.Element {
  const { channels } = props;

  function linkToRoute(name: string) {
    window.location.hash = name;
  }

  function renderChannelList(list: IChannel[]): JSX.Element {
    return (
      <ul className={styles.list}>
        {list.map((channel: IChannel, i: number) => {
          return (
            // eslint-disable-next-line react/no-array-index-key
            <li className={styles.item} key={channel.name + i}>
              <img
                src={channel.icon}
                className={styles.icon}
                alt={channel.name}
              />
              <span className={styles.name}>{channel.name}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.toolbar}>
          <span className={styles.toolbarItem}>
            <Icon name="add" />
          </span>
          <span className={styles.toolbarItem}>
            <Icon name="folder" />
          </span>
          <span className={styles.toolbarItem}>
            <Icon name="refresh" />
          </span>
          <span
            className={styles.toolbarItem}
            onClick={() => {
              linkToRoute(routesConfig.SETTINGS);
            }}
            aria-hidden="true"
          >
            <Icon name="settings" />
          </span>
        </div>
      </div>
      <div className={styles.official}>
        <div
          className={styles.officialItem}
          onClick={() => {
            linkToRoute(routesConfig.HOME);
          }}
          aria-hidden="true"
        >
          <Icon
            customClass={styles.officialItemIcon}
            name="mark_email_unread"
          />
          所有未读
        </div>
        <div
          className={styles.officialItem}
          onClick={() => {
            linkToRoute(routesConfig.TODAY);
          }}
          aria-hidden
        >
          <Icon customClass={styles.officialItemIcon} name="calendar_today" />
          今日未读
        </div>
      </div>
      <div className={styles.inner}>{renderChannelList(channels)}</div>
    </div>
  );
}

export { Channel };
