import classnames from 'classnames';
import React from 'react';

const slugify = string => string.toLowerCase().replace(/\s/, '-');

const Section = props => {
  const classes = classnames('section', slugify(props.title), {
    'inverse': props.inverse,
    'padded': props.padded
  });

  return (
    <section className={classes}>
      <h2 className="section__heading">{props.title}</h2>
      <div className="section__content">
        {props.children}
      </div>
    </section>
  );
};

export default Section;
