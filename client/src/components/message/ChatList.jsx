import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';

// COMPONENTS
import {
  MESS_TYPES,
  getConversations,
} from '../../redux/actions/messageAction';
import UserCard from '../usercard/UserCard';
import styles from './LeftSide.module.css';
import { FaCircle } from 'react-icons/fa';

const ChatList = () => {
  const { auth, message, online, notify } = useSelector((state) => state);
  const dispatch = useDispatch();

  const history = useHistory();
  const { id } = useParams();

  useEffect(() => {
    if (message.firstLoad) return;
    dispatch(getConversations({ auth }));
  }, [dispatch, auth, message.firstLoad]);

  useEffect(() => {
    dispatch(getConversations({ auth }));
  }, [message.resultUsers, auth, dispatch]);

  // Check User Online - Offline
  useEffect(() => {
    if (message.firstLoad) {
      dispatch({ type: MESS_TYPES.CHECK_ONLINE_OFFLINE, payload: online });
    }
  }, [online, message.firstLoad, dispatch]);

  const handleAddUser = (user) => {
    // setSearch('');
    dispatch({
      type: MESS_TYPES.SEARCH_USER,
      payload: [],
    });
    dispatch({
      type: MESS_TYPES.ADD_USER,
      payload: { ...user, text: '', media: [] },
    });
    dispatch({ type: MESS_TYPES.CHECK_ONLINE_OFFLINE, payload: online });
    return history.push(`/message/${user._id}`);
  };

  const isActive = (user) => {
    if (id === user._id) return 'active';
    return '';
  };

  return (
    <div className={styles.chat_list}>
      {message.searchUser.length !== 0 ? (
        <>
          {message.searchUser.map((user) => {
            return (
              <div
                key={user._id}
                className={`${styles.message_user} ${isActive(user)}`}
                onClick={() => handleAddUser(user)}
              >
                <UserCard user={user} />
              </div>
            );
          })}
        </>
      ) : (
        <>
          {message.users.map((user) => {
            return (
              <div
                key={user._id}
                className={`${styles.message_user} ${isActive(user)}`}
                onClick={() => handleAddUser(user)}
              >
                <UserCard user={user} msg={true}>
                  {user.online && <FaCircle className={styles.fa_circle} />}
                </UserCard>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default ChatList;
