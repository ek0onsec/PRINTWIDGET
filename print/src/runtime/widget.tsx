/** @jsx jsx */
/**
Experience Builder Print widget.
Creator: Robert Scheitlin
License: http://www.apache.org/licenses/LICENSE-2.0
*/
import { React, AllWidgetProps, jsx, IMState} from 'jimu-core';
import {Button, Select, Icon, TextInput, Label, WidgetPlaceholder} from 'jimu-ui';
import {IMConfig} from '../config';
import defaultMessages from './translations/default';
import {JimuMapView, JimuMapViewComponent} from 'jimu-arcgis';
import {getStyle} from './lib/style';
import * as PrintTask from "esri/tasks/PrintTask";
import * as PrintParameters from "esri/tasks/support/PrintParameters";
import * as PrintTemplate from "esri/tasks/support/PrintTemplate";
import * as esriRequest from "esri/request";
import * as MapView from "esri/views/MapView";

const rightArrowIcon = require('jimu-ui/lib/icons/arrow-right-8.svg');
const downArrowIcon = require('jimu-ui/lib/icons/arrow-down-8.svg');
const printIcon = require('./assets/icon.svg');
const printIcon2 = require('./assets/printer.svg')

interface ExtraProps{
  pSearchData: any
}

interface State {
  jimuMapView: JimuMapView,
  printTitle: string,
  layoutChoiceList: [],
  formatChoiceList: [],
  selectedLayout: "map-only"|"a3-landscape"|"a3-portrait"|"a4-landscape"|"a4-portrait"|"letter-ansi-a-landscape"|"letter-ansi-a-portrait"|"tabloid-ansi-b-landscape"|"tabloid-ansi-b-portrait",
  selectedFormat: "pdf"|"png32"|"png8"|"jpg"|"gif"|"eps"|"svg"|"svgz",
  author: string,
  copyright: string,
  advPrintOptsOpen: boolean,
  currentArrow: any,
  showTitle: boolean,
  resultListCnt: number,
  printRequestComplete: boolean,
  showClearPrints: boolean
}

export default class Widget extends React.PureComponent<AllWidgetProps<IMConfig> & ExtraProps, State>{
  static mapExtraStateProps = (state: IMState, ownProps: AllWidgetProps<IMConfig>): ExtraProps => {
    let wId: string;
    for (const [key, value] of Object.entries(state.widgetsState)) {
      if(value.pSearchData){
        wId = key;
      }
    }
    return {
      pSearchData: state.widgetsState[wId]?.pSearchData
    }
  }

  printDivRef: React.RefObject<HTMLDivElement> = React.createRef();
  printTask: PrintTask;
  printparams: PrintParameters;
  fileHandle;
  resultListRecords = [];
  constructor(props) {
    super(props);
    const {config} = this.props;
    this.state = {
      jimuMapView: undefined,
      printTitle: config.defaultTitle,
      layoutChoiceList: [],
      formatChoiceList: [],
      selectedLayout: config.defaultLayout,
      selectedFormat: config.defaultFormat,
      author: config.defaultAuthor,
      copyright: config.defaultCopyright,
      advPrintOptsOpen: false,
      currentArrow: rightArrowIcon,
      showTitle: true,
      resultListCnt: 0,
      printRequestComplete: false,
      showClearPrints: false
    };
    this.printTask = new PrintTask({url: config.serviceURL});
    this.printparams = new PrintParameters();
    this.resultListRecords = [];
  }

  nls = (id: string) => {
    return this.props.intl ? this.props.intl.formatMessage({ id: id, defaultMessage: defaultMessages[id] }) : id;
  }

  activeViewChangeHandler = (jimuMapView: JimuMapView) => {
    //Async errors
    if (null === jimuMapView || undefined === jimuMapView) {
      this.setState({ jimuMapView: null });
      return; //skip null
    }
    this.setState({ jimuMapView: jimuMapView });
    jimuMapView.whenJimuMapViewLoaded().then(()=>{
      this.printparams.view = jimuMapView.view as MapView;
      this.printparams.outSpatialReference = this.state.jimuMapView.view.spatialReference;
    });
  }

  componentDidMount() {
    const {config} = this.props;
    esriRequest(config.serviceURL, {
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

  mapTitleChange = (evt) => {
    const value = evt?.target?.value
    this.setState({printTitle: value});
  }

  handleOnLayoutChange = (evt) => {
    const value = evt?.target?.value
    if(value === 'MAP_ONLY'){
      this.setState({showTitle: false, selectedLayout: value});
    }else{
      this.setState({showTitle: true, selectedLayout: value});
    }
  }

  handleOnFormatChange = (evt) => {
    const value = evt?.target?.value
    this.setState({selectedFormat: value});
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

  printClick = (evt) => {
    this.setState({printRequestComplete: false});
    const {selectedLayout, selectedFormat, printTitle, author, copyright} = this.state;
    var template = new PrintTemplate();
    template.format = selectedFormat;
    template.layout = selectedLayout;
    template.scalePreserved = false;
    template.attributionVisible = false;
    template.layoutOptions = {
      titleText: printTitle,
      authorText: author,
      copyrightText: copyright,
      customTextElements: this.props.pSearchData
    }
    this.printparams.template = template;
    this.fileHandle = this.printTask.execute(this.printparams,{useProxy: false});
    this.resultListRecords.push({
      format: template.format,
      title: printTitle,
      url: '',
      error: false,
      alttitle: printTitle
    });
    this.setState({resultListCnt: this.state.resultListCnt + 1}, ()=>{
      if(this.state.resultListCnt > 0){
        this.setState({showClearPrints: true});
      }
    });
    this.fileHandle.then(result=>{
      this.resultListRecords[this.state.resultListCnt - 1].url = result.url;
      this.setState({printRequestComplete: true});
    }, error=>{
      this.resultListRecords[this.state.resultListCnt - 1].error = true;
      this.setState({printRequestComplete: true});
    });
  }

  authorChanged = (evt) => {
    const value = evt?.target?.value
    this.setState({author: value});
  }

  copyrightChanged = (evt) => {
    const value = evt?.target?.value
    this.setState({copyright: value});
  }

  openAdvPrintOpts = () => {
    this.setState({currentArrow: (this.state.advPrintOptsOpen)?rightArrowIcon:downArrowIcon});
    this.setState({advPrintOptsOpen: !this.state.advPrintOptsOpen});
  }

  clearPrintsHandler = (evt) => {
    evt.preventDefault();
    this.resultListRecords = [];
    this.setState({showClearPrints: false});
    this.setState({resultListCnt: 0});
  }

  updateFileNames = (arr) => {
    var arr1 = new Array();
    for (var r in arr){
      if(arr1.find(t => t.title === arr[r].title) !== undefined){
        var ind=1;
        while(arr1.find(t => t.title === arr[r].title + '(' + ind + ')') !== undefined){
          ind++;
        }
        var str = arr[r].title + '(' + ind + ')';
        arr[r].title = str;
        arr1.push(arr[r]);
      }else{
        arr1.push(arr[r]);
      }
    }
    return arr1;
  }

  getPrintResults = (): JSX.Element[] => {
    const resultsArray = [];
    this.resultListRecords = this.updateFileNames(this.resultListRecords);
    this.resultListRecords.map((r, i)=>{
      let rFileExt:string = '';
      switch (r.format) {
        case 'PDF':
          rFileExt = 'pdf'
          break;
        case 'PNG32', 'PNG8':
          rFileExt = 'png'
          break;
        case 'JPG':
          rFileExt = 'jpg'
          break;
        case 'GIF':
          rFileExt = 'gif'
          break;
        case 'EPS':
          rFileExt = 'eps'
          break;
        case 'SVG':
          rFileExt = 'svg'
          break;
        case 'SVGZ':
          rFileExt = 'svgz'
          break;
        case 'AIX':
          rFileExt = 'aix'
          break;
        default:
          rFileExt = 'pdf'
      }
      let rFileName:string = r.title + "." + rFileExt;
      
      let iconClassName: string;
      if(r.url===''){
        iconClassName = 'esri-icon-loading-indicator esri-rotating';
      }else{
        iconClassName = 'esri-icon-launch-link-external';
      }
      if(r.error){
        iconClassName = 'esri-icon-error esri-print__exported-file--error';
      }
      
      resultsArray.push(
        <div aria-label="Open this" className="esri-print__exported-file" title={r.error?this.nls('printError'):''}>
          <a aria-label={rFileName + ". Open in new window."} download={rFileName} rel="noreferrer" target="_blank"
            className={`esri-widget__anchor esri-print__exported-file-link${r.url===''?' esri-widget__anchor--disabled':''}`} href={r.url}>
            <span className={iconClassName}></span>
            <span className={`esri-print__exported-file-link-title${r.error?' esri-print__exported-file--error':''}`}>{rFileName}</span>
          </a>
        </div>
      );
    });
    if(resultsArray.length === 0){
      resultsArray.push(
        <div>{this.nls('printMessage')}</div>
      );
    }
    return resultsArray;
  }

  render(){
    let content = null;
    const useMapWidget = this.props.useMapWidgetIds &&
                        this.props.useMapWidgetIds[0]
    const {advPrintOptsOpen, currentArrow, showTitle, selectedLayout, selectedFormat} = this.state;
    const {config} = this.props;

    if (!useMapWidget) {
      content = (
        <div className='widget-print'>
          <WidgetPlaceholder icon={printIcon2} autoFlip message={this.props.intl.formatMessage({ id: '_widgetLabel', defaultMessage: defaultMessages._widgetLabel })} widgetId={this.props.id} />
        </div>
      )
    } else {
      content = (
      <div className='widget-print'>
        {useMapWidget && (
            <JimuMapViewComponent
              useMapWidgetId={this.props.useMapWidgetIds?.[0]}
              onActiveViewChange={this.activeViewChangeHandler}
            />
        )}
        <div className={'m-2'} style={{display: showTitle?'flex':'none'}}>
          <Label style={{width:'90px', lineHeight:'32px'}}>{this.nls('printTitle')+': '}</Label>
          <TextInput style={{ display:'inline-block', width: 'calc(100% -70px)' }} value={this.state.printTitle}
            onChange={this.mapTitleChange}></TextInput>
        </div>
        <div className={'d-flex m-2'}>
          <Label style={{width:'90px', lineHeight:'32px'}}>{this.nls('layout')+': '}</Label>
          <Select style={{display:'inline-block', width:'calc(100% -70px)'}} onChange={this.handleOnLayoutChange}
            className="top-drop" value={selectedLayout}>
            {this.getLayoutOptions()}
          </Select>
        </div>
        <div className={'d-flex m-2'}>
          <Label style={{width:'90px', lineHeight:'32px'}}>{this.nls('format')+': '}</Label>
          <Select style={{display:'inline-block', width:'calc(100% -70px)'}} onChange={this.handleOnFormatChange}
            className="top-drop" value={selectedFormat}>
            {this.getFormatOptions()}
          </Select>
        </div>
        <div className={'d-flex m-2 flex-column'}>
          <Button style={{textAlign: 'left'}} type='secondary' onClick={this.openAdvPrintOpts}><Icon icon={currentArrow}></Icon>{this.nls('advPrintOptions')}</Button>
        </div>
        {advPrintOptsOpen &&
          <div className={'m-2'}>
            <div>
              <Label>{this.nls('author')}</Label>
              <TextInput value={this.state.author} onChange={this.authorChanged}></TextInput>
            </div>
            <div style={{marginTop: '12px'}}>
              <Label>{this.nls('copyright')}</Label>
              <TextInput value={this.state.copyright} onChange={this.copyrightChanged}></TextInput>
            </div>
          </div>
        }
        <div className={'d-flex m-2'}>
          <div style={{flexGrow: 1}}></div>
          <div>
            <Button type="primary" onClick={e=>{this.printClick(e)}}><Icon icon={printIcon} color={'#ffffff'}></Icon>{this.nls('print')}</Button>
          </div>
        </div>
        <div className="esri-print__export-panel-container m-2" style={{position: 'relative'}}>
          <h3 className="esri-print__export-title esri-widget__heading">Printed files</h3>
          <a style={{position:'absolute', top:'14px', right: '10px', display: this.state.showClearPrints ? "block" : "none"}}
            onClick={(e) => this.clearPrintsHandler(e)}
            href="#">{this.nls('clear')}</a>
          {this.getPrintResults()}
        </div>
      </div>
      )
    }
    return <div className="widget-print jimu-widget" css={getStyle(this.props.theme, config)}>
      {content}
    </div>
  }
}
