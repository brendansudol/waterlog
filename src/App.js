import { styled } from "baseui";
import { Block } from "baseui/block";
import { Button, KIND, SHAPE, SIZE } from "baseui/button";
import { ButtonGroup } from "baseui/button-group";
import Delete from "baseui/icon/delete";
import { ProgressBar } from "baseui/progress-bar";
import { Slider } from "baseui/slider";
import { format as fmt } from "d3-format";
import { format, getTime, parse } from "date-fns";
import memoize from "memoize-one";
import React, { Component, Fragment } from "react";
import Confetti from "react-dom-confetti";

const GOAL_VALUE = 100;

const CONFETTI_CONFIG = {
  angle: 135,
  spread: 100,
  startVelocity: 30,
  elementCount: 50,
  dragFriction: 0.1,
  duration: 6000,
  delay: 0,
  width: "10px",
  height: "10px",
  colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
};

const UNITS = [
  { label: "oz", scale: 1, step: 1, max: 16, initial: 8, formatter: fmt(".0f") },
  { label: "L", scale: 0.0295735, step: 0.25, max: 1, initial: 0.5, formatter: fmt(".2~f") }
];

const formatPercent = fmt(".0%");
const formatValue = (value, unit) => `${unit.formatter(value * unit.scale)}${unit.label}`;

const padding = x => ({ paddingTop: x, paddingBottom: x, paddingLeft: x, paddingRight: x });
const margin = x => ({ marginTop: x, marginBottom: x, marginLeft: x, marginRight: x });

const getDateKey = date => format(date, "YYYYMMDD");
const getValue = (obj, key, fallback) => (obj[key] != null ? obj[key] : fallback);
const getTotal = memoize(entries => entries.reduce((acc, curr) => acc + curr.value, 0));
const getSavedState = date => {
  try {
    return JSON.parse(localStorage.getItem(getDateKey(date)));
  } catch {}
};

const Container = styled("div", ({ $theme }) => ({
  margin: "0 auto",
  maxWidth: "500px",
  padding: $theme.sizing.scale600
}));

const ThumbValue = styled("div", ({ $theme }) => ({
  position: "absolute",
  top: `-${$theme.sizing.scale800}`,
  ...$theme.typography.font300,
  backgroundColor: "transparent"
}));

class App extends Component {
  constructor(props) {
    super(props);

    const saved = getSavedState(props.date) || {};
    const unitIdx = getValue(saved, "unitIdx", 0);

    this.state = {
      entries: getValue(saved, "entries", []),
      localValue: getValue(saved, "localValue", UNITS[unitIdx].initial),
      unitIdx
    };
  }

  handleAddEntry = () => {
    this.setState(
      prev => ({
        entries: [
          ...prev.entries,
          { value: prev.localValue / UNITS[prev.unitIdx].scale, time: getTime(new Date()) }
        ]
      }),
      this.updateLocalStorage
    );
  };

  handleDeleteEntry = deleteIdx => () => {
    this.setState(
      prev => ({
        entries: prev.entries.filter((_, idx) => idx !== deleteIdx)
      }),
      this.updateLocalStorage
    );
  };

  handleSliderChange = ({ value }) => {
    this.setState({ localValue: value[0] });
  };

  handleUnitClick = (event, idx) => {
    if (this.state.unit === idx) return;
    this.setState({ unitIdx: idx, localValue: UNITS[idx].initial }, this.updateLocalStorage);
  };

  updateLocalStorage = () => {
    const { date } = this.props;
    localStorage.setItem(getDateKey(date), JSON.stringify(this.state));
  };

  render() {
    const { date } = this.props;
    const { entries, localValue, unitIdx } = this.state;

    const total = getTotal(entries);
    const unit = UNITS[unitIdx];
    const percentDone = formatPercent(total / GOAL_VALUE);

    return (
      <Container>
        <Block marginBottom="scale600" display="flex" flexDirection="column" alignItems="center">
          {/* eslint-disable-next-line jsx-a11y/accessible-emoji */}
          <Block font="font500">💧 Waterlog 💧</Block>
          <Block font="font400">{format(date, "ddd, MMM Do")}</Block>
        </Block>
        <Block display="flex" justifyContent="center" alignItems="center">
          <ButtonGroup
            selected={unitIdx}
            mode="radio"
            size={SIZE.compact}
            onClick={this.handleUnitClick}
          >
            <Button>ounces</Button>
            <Button>liters</Button>
          </ButtonGroup>
          <Block flex="1 1 auto">
            <Slider
              value={[localValue]}
              min={0}
              max={unit.max}
              step={unit.step}
              onChange={this.handleSliderChange}
              overrides={{
                Track: {
                  style: ({ $theme }) => ({
                    paddingTop: $theme.sizing.scale900,
                    paddingBottom: $theme.sizing.scale900,
                    paddingLeft: $theme.sizing.scale700,
                    paddingRight: $theme.sizing.scale700
                  })
                },
                TickBar: () => null,
                ThumbValue: ({ $value }) => (
                  <ThumbValue>
                    {$value}
                    {unit.label}
                  </ThumbValue>
                )
              }}
            />
          </Block>
          <Button size={SIZE.compact} onClick={this.handleAddEntry}>
            <Confetti active={total >= GOAL_VALUE} config={CONFETTI_CONFIG} />
            Add
          </Button>
        </Block>
        <ProgressBar
          value={total}
          successValue={GOAL_VALUE}
          getProgressLabel={() => `${formatValue(total, unit)} (${percentDone})`}
          showLabel={true}
          overrides={{
            Root: {
              style: ({ $theme }) => ({ marginBottom: $theme.sizing.scale800 })
            },
            Bar: {
              style: ({ $theme }) => ({
                ...margin(0),
                marginBottom: $theme.sizing.scale300,
                height: $theme.sizing.scale800,
                backgroundColor: $theme.colors.primary50
              })
            },
            BarProgress: {
              style: () => ({ maxWidth: "100%" })
            },
            Label: {
              style: ({ $theme }) => ({
                ...$theme.typography.font350,
                color: $theme.colors.mono1000
              })
            }
          }}
        />
        {entries.length > 0 && (
          <Fragment>
            <Block marginBottom="scale800">
              {entries.map((entry, i) => (
                <Block
                  key={i}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  marginBottom="scale400"
                  padding="scale400"
                  $style={{ backgroundColor: "rgb(247, 247, 247)", borderRadius: "5px" }}
                >
                  <Block>
                    {formatValue(entry.value, unit)} @ {format(parse(entry.time), "h:mmA")}
                  </Block>
                  <Button
                    shape={SHAPE.round}
                    kind={KIND.tertiary}
                    onClick={this.handleDeleteEntry(i)}
                    overrides={{
                      BaseButton: {
                        style: ({ $theme }) => ({ ...padding($theme.sizing.scale100) })
                      }
                    }}
                  >
                    <Delete />
                  </Button>
                </Block>
              ))}
            </Block>
          </Fragment>
        )}
      </Container>
    );
  }
}

export default App;
