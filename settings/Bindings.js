// We have to remove node_modules/react to avoid having multiple copies loaded.
// eslint-disable-next-line import/no-unresolved
import React, { PropTypes } from 'react';
import { Row, Col } from 'react-bootstrap';
import Pane from '@folio/stripes-components/lib/Pane';
import TextArea from '@folio/stripes-components/lib/TextArea';


class Bindings extends React.Component {
  static propTypes = {
    stripes: PropTypes.shape({
      logger: PropTypes.shape({
        log: PropTypes.func.isRequired,
      }).isRequired,
    }).isRequired,
    data: PropTypes.object.isRequired,
    mutator: PropTypes.shape({
      recordId: PropTypes.shape({
        replace: PropTypes.func,
      }),
      setting: PropTypes.shape({
        POST: PropTypes.func.isRequired,
        PUT: PropTypes.func.isRequired,
      }),
    }).isRequired,
    label: PropTypes.string.isRequired,
  };

  static manifest = Object.freeze({
    recordId: {},
    setting: {
      type: 'okapi',
      records: 'configs',
      path: 'configurations/entries?query=(module=ORG and config_name=bindings)',
      POST: {
        path: 'configurations/entries',
      },
      PUT: {
        path: 'configurations/entries/${recordId}', // eslint-disable-line no-template-curly-in-string
      },
    },
  });

  constructor(props) {
    super(props);
    this.changeSetting = this.changeSetting.bind(this);
  }

  changeSetting(e) {
    const value = e.target.value;
    this.props.stripes.logger.log('action', 'updating bindings');
    const record = this.props.data.setting[0];

    if (record) {
      // Setting has been set previously: replace it
      this.props.mutator.recordId.replace(record.id);
      record.value = value;
      // XXX This manual deletion should not be necessary
      delete record._cid; // eslint-disable-line no-underscore-dangle
      this.props.mutator.setting.PUT(record);
    } else {
      // No setting: create a new one
      this.props.mutator.setting.POST({
        module: 'ORG',
        config_name: 'bindings',
        value,
      });
    }
  }

  render() {
    const settings = this.props.data.setting || [];
    const value = (settings.length === 0) ? '' : settings[0].value;

    return (
      <Pane defaultWidth="fill" fluidContentWidth paneTitle={this.props.label}>
        <Row>
          <Col xs={12}>
            <label htmlFor="setting">Edit key bindings as JSON</label>
            <br />
            <TextArea
              id="setting"
              value={value}
              fullWidth
              rows="12"
              onChange={this.changeSetting}
            />
          </Col>
        </Row>
      </Pane>
    );
  }
}

export default Bindings;