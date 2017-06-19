// We have to remove node_modules/react to avoid having multiple copies loaded.
// eslint-disable-next-line import/no-unresolved
import React, { PropTypes } from 'react';
import { Row, Col } from 'react-bootstrap';
import Pane from '@folio/stripes-components/lib/Pane';
import TextArea from '@folio/stripes-components/lib/TextArea';


class Bindings extends React.Component {
  static contextTypes = {
    stripes: PropTypes.shape({
      logger: PropTypes.shape({
        log: PropTypes.func.isRequired,
      }).isRequired,
      bindings: PropTypes.object,
    }).isRequired,
  };

  static propTypes = {
    data: PropTypes.object.isRequired,
    mutator: PropTypes.shape({
      bindings_recordId: PropTypes.shape({
        replace: PropTypes.func,
      }),
      bindings_setting: PropTypes.shape({
        POST: PropTypes.func.isRequired,
        PUT: PropTypes.func.isRequired,
      }),
    }).isRequired,
    label: PropTypes.string.isRequired,
  };

  static manifest = Object.freeze({
    bindings_recordId: {},
    bindings_setting: {
      type: 'okapi',
      records: 'configs',
      path: 'configurations/entries?query=(module=ORG and config_name=bindings)',
      POST: {
        path: 'configurations/entries',
      },
      PUT: {
        path: 'configurations/entries/${bindings_recordId}', // eslint-disable-line no-template-curly-in-string
      },
    },
  });

  constructor(props) {
    super(props);
    const settings = this.props.data.bindings_setting || [];

    this.changeSetting = this.changeSetting.bind(this);
    this.state = {
      value: (settings.length === 0) ? '' : settings[0].value,
      error: undefined,
    };
  }

  changeSetting(e) {
    const value = e.target.value;
    this.setState({ value });

    let json;
    try {
      json = JSON.parse(value);
      this.setState({ error: undefined });
    } catch (error) {
      this.setState({ error: error.message });
      return;
    }

    this.context.stripes.bindings = json;
    this.context.stripes.logger.log('action', 'updating bindings');

    const record = this.props.data.bindings_setting[0];
    if (record) {
      // Setting has been set previously: replace it
      this.props.mutator.bindings_recordId.replace(record.id);
      record.value = value;
      // XXX These manual deletions should not be necessary
      delete record._cid; // eslint-disable-line no-underscore-dangle
      delete record.busy;
      this.props.mutator.bindings_setting.PUT(record);
    } else {
      // No setting: create a new one
      this.props.mutator.bindings_setting.POST({
        module: 'ORG',
        config_name: 'bindings',
        value,
      });
    }
  }

  render() {
    const settings = this.props.data.bindings_setting || [];
    const value = this.state.value || (settings.length === 0 ? '' : settings[0].value);

    return (
      <Pane defaultWidth="fill" fluidContentWidth paneTitle={this.props.label}>
        <Row>
          <Col xs={12}>
            <label htmlFor="setting">Edit key bindings as JSON</label>
            <p>Provide bindings for {
              this.context.stripes.actionNames.map(name => <span key={name}><tt>{name}</tt>, </span>)
            }</p>
            <br />
            <TextArea
              id="setting"
              value={value}
              fullWidth
              rows="12"
              onChange={this.changeSetting}
            />
            <p style={{ color: 'red' }}>{this.state.error || ''}</p>
          </Col>
        </Row>
      </Pane>
    );
  }
}

export default Bindings;
