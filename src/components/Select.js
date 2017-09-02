import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, {Component} from 'react';

import Button from './Button';
import ContextMenu from './ContextMenu';
import {dispatchChangeEvent} from './util/forms';
import FormElementAddon from './FormElementAddon';
import Chevron from '../icons/Chevron';
import FormRowItem from './FormRowItem';
import Portal from './Portal';

export default class Select extends Component {
  static propTypes = {
    defaultID: PropTypes.string,
    value: PropTypes.string,
    children: PropTypes.node,
    id: PropTypes.string.isRequired,
    onClose: PropTypes.func,
    onOpen: PropTypes.func,
    onSelect: PropTypes.func
  };

  static defaultProps = {
    defaultID: '',
    persistentPlaceholder: false,
    priority: 'quaternary'
  };

  menuRef = null;
  inputRef = null;
  triggerRef = null;

  constructor(props) {
    super(props);

    this.state = {
      isOpen: false,
      selectedID: props.defaultID
    };
  }

  componentDidUpdate(_prevProps, prevState) {
    if (!prevState.isOpen && this.state.isOpen) {
      // TODO: Set focus on the dropdown menu.
    } else if (prevState.isOpen && !this.state.isOpen) {
      // this.triggerRef.focus();
    }
  }

  componentWillUpdate(_nextProps, nextState) {
    if (nextState.isOpen && !this.state.isOpen) {
      global.addEventListener('keydown', this.handleKeyDown);
      global.addEventListener('scroll', this.handleWindowScroll, {capture: true});

      if (this.props.onOpen) {
        this.props.onOpen();
      }
    } else if (!nextState.isOpen && this.state.isOpen) {
      global.addEventListener('keydown', this.handleKeyDown);
      global.removeEventListener('scroll', this.handleWindowScroll, {capture: true});

      if (this.props.onClose) {
        this.props.onClose();
      }
    }
  }

  getItemList(children) {
    return children.reduce(
      (accumulator, child) => {
        if (child.props.placeholder) {
          return accumulator;
        }

        accumulator.push(
          React.cloneElement(
            child,
            {
              onClick: this.handleItemClick,
              isSelected: child.props.id === this.state.selectedID
            }
          )
        );

        return accumulator;
      },
      []
    );
  }

  getLabel() {
    if (this.props.label) {
      return (
        <label className="form__element__label" htmlFor={this.props.id}>
          {this.props.label}
        </label>
      );
    }
  }

  getSelectedItem(children) {
    const selectedItem = children.find(child => {
      return (
        (this.props.persistentPlaceholder || !this.state.selectedID)
        || child.props.id === this.state.selectedID
      );
    });

    if (selectedItem) {
      return React.cloneElement(selectedItem, {isTrigger: true});
    }
  }

  getTrigger(selectItems) {
    const selectedItem = this.getSelectedItem(selectItems);

    console.log(selectedItem);

    if (this.props.triggerComponent) {
      return (
        <this.props.triggerComponent
          isOpen={this.state.isOpen}
          onClick={this.handleTriggerClick}
          setRef={this.setTriggerRef}
        >
          {selectedItem}
        </this.props.triggerComponent>
      );
    }

    return (
      <Button
        additionalClassNames="select__button"
        buttonRef={this.setTriggerRef}
        addonPlacement="after"
        onClick={this.handleTriggerClick}
        priority={this.props.priority}
        wrap={false}>
        <FormElementAddon className="select__indicator">
          <Chevron />
        </FormElementAddon>
        {selectedItem}
      </Button>
    );
  }

  handleTriggerClick = () => {
    this.toggleOpenState();
  };

  handleItemClick = id => {
    this.setState({isOpen: false, selectedID: id}, () => {
      if (this.props.onSelect) {
        this.props.onSelect(id);
      }

      if (this.inputRef) {
        dispatchChangeEvent(this.inputRef);
      }
    });
  };

  handleKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();

      this.setState({isOpen: false});
    }
  };

  handleOverlayClick = () => {
    this.toggleOpenState();
  };

  handleWindowScroll = (event) => {
    if (this.menuRef && !this.menuRef.contains(event.target)) {
      if (this.state.isOpen) {
        this.setState({isOpen: false});
      }
    }
  };

  setTriggerRef = (ref) => {
    if (this.state.triggerRef !== ref) {
      this.setState({triggerRef: ref});
    }
  };

  toggleOpenState = () => {
    this.setState({
      isOpen: !this.state.isOpen
    });
  };

  render() {
    const selectItems = React.Children.toArray(this.props.children);
    const classes = classnames(
      'select form__element',
      this.props.additionalClassNames,
      {
        'form__element--label-offset': this.props.labelOffset,
        'select--is-open': this.state.isOpen
      }
    );

    return (
      <FormRowItem
        shrink={this.props.shrink}
        grow={this.props.grow}
        labelOffset={this.props.labelOffset}
        width={this.props.width}
      >
        {this.getLabel()}
        <div className={classes}>
          <input
            className="input input--hidden"
            name={this.props.id}
            onChange={(event) => {console.log(event)}}
            tabIndex={-1}
            ref={ref => this.inputRef = ref}
            type="text"
            value={this.state.selectedID} />
          {this.getTrigger(selectItems)}
          <Portal>
            <ContextMenu
              onOverlayClick={this.handleOverlayClick}
              in={this.state.isOpen}
              matchTriggerWidth={this.props.matchTriggerWidth}
              menuAlign={this.props.menuAlign}
              setRef={ref => this.menuRef = ref}
              triggerRef={this.state.triggerRef}
            >
              {this.getItemList(selectItems)}
            </ContextMenu>
          </Portal>
        </div>
      </FormRowItem>
    );
  }
}
