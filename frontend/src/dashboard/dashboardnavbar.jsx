import React from 'react'

function Dashboardnavbar() {
  return (
<div>
  <nav className="navbar navbar-expand-lg navbar-absolute navbar-transparent   ">
    <div className="container-fluid">
      <div className="navbar-wrapper">
        <div className="navbar-toggle d-inline">
          <button type="button" className="navbar-toggler">
            <span className="navbar-toggler-bar bar1" />
            <span className="navbar-toggler-bar bar2" />
            <span className="navbar-toggler-bar bar3" />
          </button>
        </div>
        {/* <a className="navbar-brand" href="#pablo">Dashboard</a> */}
      </div>
      
      <div className="collapse navbar-collapse" id="navigation">
        <ul className="navbar-nav ml-auto ">
          <div className="search-bar input-group">
           
          </div>
         
          <li className="separator d-lg-none" />
        </ul>
      </div>
    </div>
  </nav>
  <div className="modal fade" id="searchModal" tabIndex={-1} role="dialog" aria-labelledby="searchModal" aria-hidden="true">
    <div className="modal-dialog" role="document">
      <div className="modal-content">
        <div className="modal-header">
          <input type="text" className="form-control" id="inlineFormInputGroup" placeholder="SEARCH" />
          <button type="button" className="close" data-dismiss="modal" aria-label="Close">
            <i className="tim-icons icon-simple-remove" />
          </button>
        </div>
        <div className="modal-footer">
        </div>
      </div>
    </div>
  </div>
</div>

  )
}

export default Dashboardnavbar;
