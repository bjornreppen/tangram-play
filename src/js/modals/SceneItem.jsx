import React from 'react';
import PropTypes from 'prop-types';

export default function SceneItem(props) {
  const date = (props.date) ? (
    <div className="open-scene-option-date">
      {/* Show the date this was saved.
          TODO: better formatting; maybe use moment.js */}
      Saved on {new Date(props.date).toLocaleString()}
    </div>
  ) : null;

  const children = (props.children) ? (
    <div className="open-scene-option-tasks">
      {props.children}
    </div>
  ) : null;

  return (
    <div className="open-scene-option">
      <div className="open-scene-option-thumbnail">
        <img src={props.thumbnail} alt="" />
      </div>
      <div className="open-scene-option-info">
        <div className="open-scene-option-name">
          {props.name}
        </div>
        <div className="open-scene-option-description">
          {props.description}
        </div>
        {date}
      </div>
      {children}
    </div>
  );
}

SceneItem.propTypes = {
  thumbnail: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  date: PropTypes.string,
  children: PropTypes.node,
};

SceneItem.defaultProps = {
  description: 'No description provided.',
  date: '',
  children: null,
};
