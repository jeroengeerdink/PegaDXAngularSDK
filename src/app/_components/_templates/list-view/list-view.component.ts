
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AngularPConnectService } from "../../../_bridge/angular-pconnect";
import { ProgressSpinnerService } from "../../../_messages/progress-spinner.service";
// import * as moment from "moment";
import { Utils } from "../../../_helpers/utils";


@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.scss']
})
export class ListViewComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  @Input() pConn$: any;


  repeatList$: MatTableDataSource<any>;
  fields$ : Array<any>;

  displayedColumns$ = Array<string>();

  configProps: any;

  searchIcon$: string;

  PCore$: any;


  constructor(private psService: ProgressSpinnerService,
              private utils: Utils) { 


  }

  ngOnInit(): void {

    if (!this.PCore$) {
      this.PCore$ = window.PCore;
    }

    const componentConfig = this.pConn$.getComponentConfig();
    this.configProps = this.pConn$.getConfigProps();

    const refList = this.configProps.referenceList;

    this.searchIcon$ = this.utils.getImageSrc("search", this.PCore$.getAssetLoader().getStaticServerUrl());

    // returns a promise
    const workListData = this.PCore$.getDataApiUtils().getData(refList, {});

    workListData.then( (workListJSON: Object) => {

      // don't update these fields until we return from promise
      this.fields$ = this.configProps.presets[0].children[0].children;
      // this is an unresovled version of this.fields$, need unresolved, so can get the property reference
      let columnFields = componentConfig.presets[0].children[0].children;

      const tableDataResults = workListJSON["data"].data;

      this.displayedColumns$ = this.getDisplayColums(columnFields);
      this.fields$ = this.updateFields(this.fields$, this.displayedColumns$);

      let updatedRefList = this.updateData(tableDataResults, this.fields$);

      this.repeatList$ = new MatTableDataSource(updatedRefList);



      this.repeatList$.paginator = this.paginator;
      
    });



  }

  ngOnDestroy() {


  }

  ngAfterViewInit() {

    return;

    // paginator has to exist for this to work,
    // so called after init (paginator drawn)
    this.repeatList$.paginator = this.paginator;
    this.repeatList$.sort = this.sort;
  }


  updateFields(arFields, arColumns) : Array<any> {
    let arReturn = arFields;
    for (let i in arReturn) {
      arReturn[i].config.name = arColumns[i];
    }

    return arReturn;
  }

  applySearch(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.repeatList$.filter = filterValue.trim().toLowerCase();

    if (this.repeatList$.paginator) {
      this.repeatList$.paginator.firstPage();
    }
  }

  rowClick(row) {

    switch (this.configProps.rowClickAction) {
      case "openAssignment" :
        this.psService.sendMessage(true);
        this.openAssignment(row);
        break;

    }
    




  }

  updateData( listData:Array<any>, fieldData:Array<any>): Array<any> {
    let returnList : Array<any> = new Array<any>();
    for ( let row in listData) {
       // copy
      let rowData = JSON.parse(JSON.stringify(listData[row]));


      for (let field in fieldData) {
        let config = fieldData[field].config
        let fieldName;
        let formattedDate;

        switch (fieldData[field].type) {
          case "Date" :
            fieldName = config.name;
            formattedDate = this.utils.generateDate(rowData[fieldName], config.formatter);

            rowData[fieldName] = formattedDate;
            break;
          case "DateTime" :
            fieldName = config.name;
            formattedDate = this.utils.generateDateTime(rowData[fieldName], config.formatter);

            rowData[fieldName] = formattedDate;
            break;
        }

      }

      returnList.push(rowData);
    }

    return returnList;
  }

  openAssignment(row) {
    //let sKey = row.pzInsKey

    const { pxRefObjectClass, pzInsKey } = row;
    let sTarget = this.pConn$.getContainerName();


    let options = { "containerName" : sTarget};

    this.pConn$.getActionsApi().openAssignment(pzInsKey, pxRefObjectClass, options);
  }

  
  initializeData(data) {
    data.forEach((item, idx) => {
      item.__original_index = idx;
      item.__level = 1;
    });
  
    return data;
  }
   
  getType(field) {
    const { config = {}, type } = field;
    const { formatType } = config;
    if (formatType === "datetime" || formatType === "date") {
      // currently cosmos has only support for date ... it also need to support dateTime
      return "date";
    }
    return type.toLowerCase();
  }
  
  initializeColumns(fields = []) {
    return fields.map((field, originalColIndex) => ({
      ...field,
      type: this.getType(field),
      name: field.config.value.substring(4),
      label: field.config.label.substring(3),
      id: originalColIndex,
      groupingEnabled: true,
      grouped: false,
      minWidth: 50,
      cellRenderer: this.getType(field) === "text" ? null : field.type,
      filter: true,
    }));
  }

  getDisplayColums(fields = []) {
    let arReturn = fields.map(( field, colIndex) => {
      let theField = field.config.value.substring(field.config.value.indexOf(" ")+1);
      if (theField.indexOf(".") == 0) {
        theField = theField.substring(1);
      }

      return theField;
    });
    return arReturn;
 
  }

}
