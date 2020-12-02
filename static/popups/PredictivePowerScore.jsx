import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import { RemovableError } from "../RemovableError";
import { buildURL } from "../actions/url-utils";
import { fetchJson } from "../fetcher";
import CorrelationsGrid from "./correlations/CorrelationsGrid";
import corrUtils from "./correlations/correlationsUtils";
import { BouncerWrapper } from "../BouncerWrapper";

require("./PredictivePowerScore.css");

class PredictivePowerScore extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      correlations: null,
      selectedCols: [],
      hasDate: false,
      loadingPps: true,
    };
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }
    const stateProps = ["error", "correlations", "selectedCols"];
    if (!_.isEqual(_.pick(this.state, stateProps), _.pick(newState, stateProps))) {
      return true;
    }
    return false;
  }

  componentDidMount() {
    const params = { ...this.props.chartData, pps: true };
    fetchJson(
      buildURL(`${corrUtils.BASE_CORRELATIONS_URL}/${this.props.dataId}`, params, ["query", "pps"]),
      gridData => {
        if (gridData.error) {
          this.setState({ loadingPps: false, error: <RemovableError {...gridData} /> });
          return;
        }
        const { data, pps } = gridData;
        const columns = _.map(data, "column");
        const state = {
          correlations: data,
          pps,
          columns,
          loadingPps: false,
        };
        this.setState(state, () => {
          let { col1, col2 } = this.props.chartData || {};
          if (_.isUndefined(col1)) {
            if (_.isUndefined(col2)) {
              [col1, col2] = _.take(columns, 2);
            } else {
              col1 = _.find(columns, c => c !== col2);
            }
          } else if (_.isUndefined(col2)) {
            col2 = _.find(columns, c => c !== col1);
          }
          this.setState({ selectedCols: [col1, col2] });
        });
      }
    );
  }

  render() {
    const { error, pps, selectedCols } = this.state;
    const ppsInfo = _.find(pps, { x: selectedCols?.[0], y: selectedCols?.[1] });
    return (
      <div key="body" className="modal-body scatter-body">
        {error}
        {!error && (
          <BouncerWrapper showBouncer={this.state.loadingPps}>
            <CorrelationsGrid
              buildScatter={selectedCols => this.setState({ selectedCols })}
              selectedCols={selectedCols}
              colorScale={corrUtils.ppsScale}
              {...this.state}
            />
            {ppsInfo !== undefined && (
              <React.Fragment>
                <h2 className="pt-5">{`${_.join(selectedCols, "/")} Prediction Power Score: ${ppsInfo.ppscore}`}</h2>
                <ul className="ppscore-descriptors">
                  <li>
                    {"Baseline Score: "}
                    <span>{ppsInfo.baseline_score}</span>
                  </li>
                  <li>
                    {"Case: "}
                    <span>{ppsInfo.case}</span>
                  </li>
                  <li>
                    {"Is Valid Score: "}
                    <span>{ppsInfo.is_valid_score ? "True" : "False"}</span>
                  </li>
                  <li>
                    {"Metric: "}
                    <span>{ppsInfo.metric}</span>
                  </li>
                  <li>
                    {"Model: "}
                    <span>{ppsInfo.model}</span>
                  </li>
                  <li>
                    {"Model Score: "}
                    <span>{ppsInfo.model_score}</span>
                  </li>
                </ul>
              </React.Fragment>
            )}
          </BouncerWrapper>
        )}
      </div>
    );
  }
}
PredictivePowerScore.displayName = "PredictivePowerScore";
PredictivePowerScore.propTypes = {
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
    query: PropTypes.string,
    title: PropTypes.string,
    col1: PropTypes.string,
    col2: PropTypes.string,
  }),
  propagateState: PropTypes.func,
};

export { PredictivePowerScore };
