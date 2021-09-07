/**
  Licensing

  Copyright 2020 Esri

  Licensed under the Apache License, Version 2.0 (the "License"); You
  may not use this file except in compliance with the License. You may
  obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
  implied. See the License for the specific language governing
  permissions and limitations under the License.

  A copy of the license is available in the repository's
  LICENSE file.
*/
import {React, defaultMessages as jimuCoreMessages, loadArcGISJSAPIModules} from 'jimu-core';
import {AllWidgetSettingProps} from 'jimu-for-builder';
import {IMConfig} from '../config';
import defaultMessages from './translations/default';
import {JimuMapViewSelector, SettingSection, SettingRow} from 'jimu-ui/advanced/setting-components';
import {Select, TextInput, defaultMessages as jimuUIDefaultMessages,} from 'jimu-ui';

export interface WidgetSettingState{
  layoutChoiceList: [],
  formatChoiceList: [],
  selectedLayout: any,
  selectedFormat: any
}

export default class Setting extends React.PureComponent<AllWidgetSettingProps<IMConfig>, WidgetSettingState>{
  esriRequest: typeof __esri.request = null;
  constructor (props) {
    super(props)
    this.state = {
      layoutChoiceList: [],
      formatChoiceList: [],
      selectedLayout: this.props.config.defaultLayout,
      selectedFormat: this.props.config.defaultFormat
    }
  }

  componentDidMount () {
    loadArcGISJSAPIModules([
      'esri/request'
    ]).then(module => {
      [this.esriRequest] = module;
      this.initPrintServiceParams();
    })
  }

  initPrintServiceParams = () => {
    this.esriRequest(this.props.config.serviceURL, {
      responseType: "json",
      query: {
        f: 'json'
      },
      timeout: 10000,
      useProxy: false}
    ).then(results=>{
      let printJSON = results.data;
      printJSON.parameters.map(param=>{
        if(param.name === 'Format'){
          this.setState({formatChoiceList: param.choiceList})
        }
        if(param.name === 'Layout_Template'){
          this.setState({layoutChoiceList: param.choiceList})
        }
      });
    });
  }

  getLayoutOptions = (): JSX.Element[] => {
    const optionsArray = [];
    this.state.layoutChoiceList.map((val, index) =>{
      optionsArray.push(<option key={index} value={val}>{val}</option>);
    });
    return optionsArray;
  }

  getFormatOptions = (): JSX.Element[] => {
    const optionsArray = [];
    this.state.formatChoiceList.map((val, index) =>{
      optionsArray.push(<option key={index} value={val}>{val}</option>);
    });
    return optionsArray;
  }

  onPropertyChange = (name, value) => {
    const { config } = this.props
    if (value === config[name]) {
      return
    }
    const newConfig = config.set(name, value)
    const alterProps = {
      id: this.props.id,
      config: newConfig
    }
    this.props.onSettingChange(alterProps)
  }

  onMapWidgetSelected = (useMapWidgetsIds: string[]) => {
    this.props.onSettingChange({
        id: this.props.id,
        useMapWidgetIds: useMapWidgetsIds
    });
  }

  formatMessage = (id: string, values?: { [key: string]: any }) => {
    const messages = Object.assign({}, defaultMessages, jimuUIDefaultMessages, jimuCoreMessages)
    return this.props.intl.formatMessage({ id: id, defaultMessage: messages[id] }, values)
  }

  serviceURLChanged = (evt) => {
    const value = evt?.target?.value
    this.onPropertyChange('serviceURL', value)
  }

  titleChanged = (evt) => {
    const value = evt?.target?.value
    this.onPropertyChange('defaultTitle', value)
  }

  authorChanged = (evt) => {
    const value = evt?.target?.value
    this.onPropertyChange('defaultAuthor', value)
  }

  copyrightChanged = (evt) => {
    const value = evt?.target?.value
    this.onPropertyChange('defaultCopyright', value)
  }

  formatChanged = (evt) => {
    const value = evt?.target?.value;
    this.setState({selectedFormat: value});
    this.onPropertyChange('defaultFormat', value);
  }

  layoutChanged = (evt) => {
    const value = evt?.target?.value;
    this.setState({selectedLayout: value});
    this.onPropertyChange('defaultLayout', value);
  }

  render() {
      const {config} = this.props;
      const {selectedLayout, selectedFormat} = this.state;
      return (
      <div>
          <div className="widget-setting-print">
            <SettingSection className="map-selector-section" title={this.props.intl.formatMessage({id: 'sourceLabel', defaultMessage: defaultMessages.sourceLabel})}>
              <SettingRow label={this.formatMessage('selectMapWidget')}>
              </SettingRow>
              <SettingRow>
                  <JimuMapViewSelector
                  onSelect={this.onMapWidgetSelected}
                  useMapWidgetIds={this.props.useMapWidgetIds}
                  />
              </SettingRow>
              <SettingRow label={this.formatMessage('serviceURL')} flow='wrap'>
                <TextInput value={config.serviceURL} onChange={this.serviceURLChanged}></TextInput>
              </SettingRow>
            </SettingSection >
            <SettingSection className="defaults-section" title={this.formatMessage('defaultsSectionLabel')}>
              <SettingRow label={this.formatMessage('defaultTitle')} flow='wrap'>
                <TextInput value={config.defaultTitle} onChange={this.titleChanged}></TextInput>
              </SettingRow>
              <SettingRow label={this.formatMessage('defaultAuthor')} flow='wrap'>
                <TextInput value={config.defaultAuthor} onChange={this.authorChanged}></TextInput>
              </SettingRow>
              <SettingRow label={this.formatMessage('defaultCopyright')} flow='wrap'>
                <TextInput value={config.defaultCopyright} onChange={this.copyrightChanged}></TextInput>
              </SettingRow>
              <SettingRow label={this.formatMessage('defaultFormat')} flow='wrap'>
                <Select style={{display:'inline-block', width:'calc(100% -70px)'}} onChange={this.formatChanged}
                  className="top-drop" value={selectedFormat}>
                  {this.getFormatOptions()}
                </Select>
              </SettingRow>
              <SettingRow label={this.formatMessage('defaultLayout')} flow='wrap'>
                <Select style={{display:'inline-block', width:'calc(100% -70px)'}} onChange={this.layoutChanged}
                  className="top-drop" value={selectedLayout}>
                  {this.getLayoutOptions()}
                </Select>
              </SettingRow>
            </SettingSection>
          </div>
      </div>
      )
  }
}