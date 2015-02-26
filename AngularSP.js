angular.module('AngularSP', []).service('AngularSPREST', ['$http','$q', function ($http, $q) {
    var self = this;
    this.IsSharePointHostedApp = false;
    this.GetItemTypeForListName = function GetItemTypeForListName(name) {
        return "SP.Data." + name.charAt(0).toUpperCase() + name.split(" ").join("").slice(1) + "ListItem";
    }
    this.GetUrlPrefix = function GetUrlPrefix()
    {
        if(self.IsSharePointHostedApp)
        {

        }
    }
    this.SanitizeWebUrl = function SanitizeWebUrl(url) {
        if (typeof (url) == "undefined" || url == null || url == "")
            url = _spPageContextInfo.siteAbsoluteUrl;
        return url;
    }
    this.CreateListItem = function CreateListItem(listName, item, webUrl) {
        var itemType = self.GetItemTypeForListName(listName);
        item["__metadata"] = { "type": itemType };
        webUrl = self.SanitizeWebUrl(webUrl);
        
        var promise = $http({
            url: webUrl + "/_api/web/lists/getbytitle('" + listName + "')/items",
            method: "POST",
            data: item,
            headers: {
                "Accept": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            }
        });
        return promise;
    }

    this.GetItemById = function GetItemById(itemId, listName, webUrl, extraParams) {
        webUrl = self.SanitizeWebUrl(webUrl);
        var url = webUrl + "/_api/web/lists/getbytitle('" + listName + "')/items(" + itemId + ")";
        if (typeof (extraParams) != "undefined" && extraParams != "") {
            url += "?" + extraParams;
        }
        var promise = $.ajax({
            url: url,
            method: "GET",
            headers: { "Accept": "application/json; odata=verbose" }
        });

        return promise;
    }
    this.GetListItems = function GetListItems(listName, webUrl, filter, sort, extraData) {
        webUrl = self.SanitizeWebUrl(webUrl);
        var url = webUrl + "/_api/web/lists/getbytitle('" + listName + "')/items";
        if (typeof (filter) != "undefined" && filter.length > 0) {
            url = url + "?$filter=" + filter;
        }
        if (typeof (sort) != "undefined" && sort.length > 0) {
            if (url.indexOf("?") > 0) {
                url = url + "&";
            }
            else {
                url = url + "?";
            }
            url = url + "$orderby=" + sort;
        }
        var promise = $http({
            url: url,
            method: "GET",
            headers: { "Accept": "application/json; odata=verbose" }
        });
        var deff = $q.defer();
        promise.success(function (data) { data.ExtraData = extraData; deff.resolve(data) }, function (data) { data.ExtraData = extraData; deff.reject(data) })
        return deff.promise;
    }
    this.GetListItemsByCAML = function GetListItemsByCAML(listName, webUrl, camlQuery, extraUrl, extraData) {
        webUrl = self.SanitizeWebUrl(webUrl);
        var url = webUrl + "/_api/web/lists/getbytitle('" + listName + "')/GetItems(query=@v1)?@v1={\"ViewXml\":\"" + camlQuery + "\"}";
        if (extraUrl.length > 0) {
            url += "&" + extraUrl;
        }
        var promise = $.ajax({
            url: url,
            method: "POST",
            headers: {
                "Accept": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            }
        });
        var deff = jQuery.Deferred();
        promise.then(function (data) { data.ExtraData = extraData; deff.resolve(data) }, function (data) { data.ExtraData = extraData; deff.reject(data) })
        return deff;
    }
    this.UpdateListItem = function UpdateListItem(itemId, listName, webUrl, updateData) {
        webUrl = self.SanitizeWebUrl(webUrl);
        var itemType = self.GetItemTypeForListName(listName);

        //var item = {
        //    "__metadata": { "type": itemType },
        //    "Title": title
        //};

        //updateData.__metadata = { "type": itemType };
        var deff = $.Deferred();
        self.GetItemById(itemId, listName, webUrl).then(function (data) {
            updateData.__metadata = { "type": data.d.__metadata.type };
            var promise = $.ajax({
                url: data.d.__metadata.uri,
                type: "POST",
                contentType: "application/json;odata=verbose",
                data: JSON.stringify(updateData),
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                    "X-HTTP-Method": "MERGE",
                    "If-Match": data.d.__metadata.etag
                }
            });
            promise.then(function (data1) { deff.resolve(data1) }, function (data1) { deff.reject(data1) });
        });
        return deff;
    }
    this.DeleteListItem = function DeleteListItem(itemId, listName, webUrl) {
        webUrl = self.SanitizeWebUrl(webUrl);
        var deff = $.Deferred();
        self.GetItemById(itemId, listName, webUrl).then(function (data) {
            var promise = $.ajax({
                url: data.d.__metadata.uri,
                type: "POST",
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "X-Http-Method": "DELETE",
                    "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                    "If-Match": data.d.__metadata.etag
                }
            });
            promise.then(function (data1) { deff.resolve(data1) }, function (data1) { deff.reject(data1) });
        });
        return deff;
    }
    this.GetGroup = function GetGroup(groupName, includeMembers, webUrl) {
        webUrl = self.SanitizeWebUrl(webUrl);

        var url = webUrl + "/_api/web/sitegroups?$filter=(Title%20eq%20%27" + groupName + "%27)";
        if (includeMembers)
            url = url + "&$expand=Users";
        var promise = $.ajax({
            url: url,
            method: "GET",
            headers: { "Accept": "application/json; odata=verbose" }
        });

        return promise;
    }
    this.GetSiteUsers = function GetSiteUsers(webUrl) {
        webUrl = self.SanitizeWebUrl(webUrl);

        var url = webUrl + "/_api/web/SiteUsers";
        var promise = $.ajax({
            url: url,
            method: "GET",
            headers: { "Accept": "application/json; odata=verbose" }
        });

        return promise;
    }
    this.GetUserById = function GetUserById(userId, webUrl)
    {
    	webUrl = self.SanitizeWebUrl(webUrl);
        var url = webUrl + "/_api/Web/GetUserById(" + userId + ")";        
        var promise = $http({
            url: url,
            method: "GET",
            headers: { "Accept": "application/json; odata=verbose" }
        });
        return promise;

    }
    this.AddUsertoGroup = function AddUsertoGroup(groupId, loginName, webUrl) {
        webUrl = self.SanitizeWebUrl(webUrl);
        var item = { LoginName: loginName };
        item["__metadata"] = { "type": "SP.User" };
        webUrl = self.SanitizeWebUrl(webUrl);
        var promise = $.ajax({
            url: webUrl + "/_api/web/sitegroups(" + groupId + ")/users",
            type: "POST",
            contentType: "application/json;odata=verbose",
            data: JSON.stringify(item),
            headers: {
                "Accept": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            }
        });
        return promise;
    }
    this.GetUserId = function getUserId(loginName) {
        var deffered = $.Deferred();
        var context = new SP.ClientContext.get_current();
        var user = context.get_web().ensureUser(loginName);
        context.load(user);
        context.executeQueryAsync(
             Function.createDelegate(null, function () { deffered.resolve(user); }),
             Function.createDelegate(null, function () { deffered.reject(user, args); })
        );
        return deffered;
    }
    this.CreateSubSite = function CreateSubSite(options, webUrl) {
        webUrl = self.SanitizeWebUrl(webUrl);
        var createData = {
            parameters: {
                '__metadata': {
                    'type': 'SP.WebInfoCreationInformation'
                },
                Url: options.siteUrl,
                Title: options.siteName,
                Description: options.siteDescription,
                Language: 1033,
                WebTemplate: options.siteTemplate,
                UseUniquePermissions: options.uniquePermissions
                //CustomMasterUrl: options.MasterUrl,
                //MasterUrl: options.MasterUrl,
                //EnableMinimalDownload: options.MinimalDownload
            }
        };
        var deffered = $.Deferred();
        // Because we don't have the hidden __REQUESTDIGEST variable, we need to ask the server for the FormDigestValue
        var __REQUESTDIGEST;
        var rootUrl = location.protocol + "//" + location.host;

        var contextInfoPromise = $.ajax({
            url: webUrl + "/_api/contextinfo",
            method: "POST",
            headers: {
                "Accept": "application/json; odata=verbose"
            },
            success: function (data) {
                __REQUESTDIGEST = data.d.GetContextWebInformation.FormDigestValue;
            },
            error: function (data, errorCode, errorMessage) {
                alert(errorMessage);
            }
        });

        // Once we have the form digest value, we can create the subsite
        $.when(contextInfoPromise).done(function () {
            $.ajax({
                url: webUrl + "/_api/web/webinfos/add",
                type: "POST",
                headers: {
                    "accept": "application/json;odata=verbose",
                    "content-type": "application/json;odata=verbose",
                    "X-RequestDigest": __REQUESTDIGEST
                },
                data: JSON.stringify(createData)
            }).then(function (data) {
                deffered.resolve(data);
            });
        });
        return deffered;
    }
    this.GetWebData = function GetWebData(webUrl) {
        webUrl = self.SanitizeWebUrl(webUrl);
        var url = webUrl + "/_api/web";

        var promise = $.ajax({
            url: url,
            method: "GET",
            headers: { "Accept": "application/json; odata=verbose" }
        });
        return promise;
    }
    this.UpdateWebData = function UpdateWebData(webUrl, updateData) {
        webUrl = self.SanitizeWebUrl(webUrl);

        var __REQUESTDIGEST;
        var contextInfoPromise = $.ajax({
            url: webUrl + "/_api/contextinfo",
            method: "POST",
            headers: {
                "Accept": "application/json; odata=verbose"
            },
            success: function (data) {
                __REQUESTDIGEST = data.d.GetContextWebInformation.FormDigestValue;
            },
            error: function (data, errorCode, errorMessage) {
                alert(errorMessage);
            }
        });
        var deff = $.Deferred();
        updateData.__metadata = { "type": "SP.Web" };
        $.when(contextInfoPromise).done(function () {
            self.GetWebData(webUrl).then(function (data) {
                $.ajax({
                    url: data.d.__metadata.uri,
                    type: "POST",
                    contentType: "application/json;odata=verbose",
                    data: JSON.stringify(updateData),
                    headers: {
                        "Accept": "application/json;odata=verbose",
                        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                        "X-HTTP-Method": "MERGE",
                        "If-Match": data.d.__metadata.etag
                    }
                }).then(function (data1) { deff.resolve(data1) }, function (data1) { deff.reject(data1) });
            });
        });
        return deff;
    }
}]);
/*angular.module('AngularSP', []).factory('AngularSPFact', ['$http', function ($http) {
    return {
        // Get List Item Type metadata
        GetItemTypeForListName: function GetItemTypeForListName(name) {
            return "SP.Data." + name.charAt(0).toUpperCase() + name.split(" ").join("").slice(1) + "ListItem";
        },
        SanitizeWebUrl: function SanitizeWebUrl(url) {
            if (typeof (url) == "undefined" || url == null || url == "")
                url = _spPageContextInfo.siteAbsoluteUrl;
            return url;
        },
        CreateListItem: function CreateListItem(listName, item, webUrl) {
            var itemType = ITG.SharePoint.GetItemTypeForListName(listName);
            item["__metadata"] = { "type": itemType };
            webUrl = ITG.SharePoint.SanitizeWebUrl(webUrl);
            var promise = $.ajax({
                url: webUrl + "/_api/web/lists/getbytitle('" + listName + "')/items",
                type: "POST",
                contentType: "application/json;odata=verbose",
                data: JSON.stringify(item),
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "X-RequestDigest": $("#__REQUESTDIGEST").val()
                }
            });
            return promise;
        },

        GetItemById: function GetItemById(itemId, listName, webUrl, extraParams) {
            webUrl = ITG.SharePoint.SanitizeWebUrl(webUrl);
            var url = webUrl + "/_api/web/lists/getbytitle('" + listName + "')/items(" + itemId + ")";
            if (typeof (extraParams) != "undefined" && extraParams != "") {
                url += "?" + extraParams;
            }
            var promise = $.ajax({
                url: url,
                method: "GET",
                headers: { "Accept": "application/json; odata=verbose" }
            });

            return promise;
        },
        GetListItems: function GetListItems(listName, webUrl, filter, sort, extraData) {
            webUrl = ITG.SharePoint.SanitizeWebUrl(webUrl);
            var url = webUrl + "/_api/web/lists/getbytitle('" + listName + "')/items";
            if (typeof (filter) != "undefined" && filter.length > 0) {
                url = url + "?$filter=" + filter;
            }
            if (typeof (sort) != "undefined" && sort.length > 0) {
                if (url.indexOf("?") > 0) {
                    url = url + "&";
                }
                else {
                    url = url + "?";
                }
                url = url + "$orderby=" + sort;
            }
            var promise = $.ajax({
                url: url,
                method: "GET",
                headers: { "Accept": "application/json; odata=verbose" }
            });
            var deff = jQuery.Deferred();
            promise.then(function (data) { data.ExtraData = extraData; deff.resolve(data) }, function (data) { data.ExtraData = extraData; deff.reject(data) })
            return deff;
        },
        GetListItemsByCAML: function GetListItemsByCAML(listName, webUrl, camlQuery, extraUrl, extraData) {
            webUrl = ITG.SharePoint.SanitizeWebUrl(webUrl);
            var url = webUrl + "/_api/web/lists/getbytitle('" + listName + "')/GetItems(query=@v1)?@v1={\"ViewXml\":\"" + camlQuery + "\"}";
            if (extraUrl.length > 0) {
                url += "&" + extraUrl;
            }
            var promise = $.ajax({
                url: url,
                method: "POST",
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "X-RequestDigest": $("#__REQUESTDIGEST").val()
                }
            });
            var deff = jQuery.Deferred();
            promise.then(function (data) { data.ExtraData = extraData; deff.resolve(data) }, function (data) { data.ExtraData = extraData; deff.reject(data) })
            return deff;
        },
        /*GetListItems: function GetListItems(listName, siteurl) {
            var promise = $.ajax({
                url: siteurl + "/_api/web/lists/getbytitle('" + listName + "')/items",
                method: "GET",
                headers: { "Accept": "application/json; odata=verbose" }
            });
    
            return promise;
        },
        UpdateListItem: function UpdateListItem(itemId, listName, webUrl, updateData) {
            webUrl = ITG.SharePoint.SanitizeWebUrl(webUrl);
            var itemType = ITG.SharePoint.GetItemTypeForListName(listName);

            //var item = {
            //    "__metadata": { "type": itemType },
            //    "Title": title
            //};

            //updateData.__metadata = { "type": itemType };
            var deff = $.Deferred();
            ITG.SharePoint.GetItemById(itemId, listName, webUrl).then(function (data) {
                updateData.__metadata = { "type": data.d.__metadata.type };
                var promise = $.ajax({
                    url: data.d.__metadata.uri,
                    type: "POST",
                    contentType: "application/json;odata=verbose",
                    data: JSON.stringify(updateData),
                    headers: {
                        "Accept": "application/json;odata=verbose",
                        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                        "X-HTTP-Method": "MERGE",
                        "If-Match": data.d.__metadata.etag
                    }
                });
                promise.then(function (data1) { deff.resolve(data1) }, function (data1) { deff.reject(data1) });
            });
            return deff;
        },
        DeleteListItem: function DeleteListItem(itemId, listName, webUrl) {
            webUrl = ITG.SharePoint.SanitizeWebUrl(webUrl);
            var deff = $.Deferred();
            ITG.SharePoint.GetItemById(itemId, listName, webUrl).then(function (data) {
                var promise = $.ajax({
                    url: data.d.__metadata.uri,
                    type: "POST",
                    headers: {
                        "Accept": "application/json;odata=verbose",
                        "X-Http-Method": "DELETE",
                        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                        "If-Match": data.d.__metadata.etag
                    }
                });
                promise.then(function (data1) { deff.resolve(data1) }, function (data1) { deff.reject(data1) });
            });
            return deff;
        },
        GetGroup: function GetGroup(groupName, includeMembers, webUrl) {
            webUrl = ITG.SharePoint.SanitizeWebUrl(webUrl);

            var url = webUrl + "/_api/web/sitegroups?$filter=(Title%20eq%20%27" + groupName + "%27)";
            if (includeMembers)
                url = url + "&$expand=Users";
            var promise = $.ajax({
                url: url,
                method: "GET",
                headers: { "Accept": "application/json; odata=verbose" }
            });

            return promise;
        },
        GetSiteUsers: function GetSiteUsers(webUrl) {
            webUrl = ITG.SharePoint.SanitizeWebUrl(webUrl);

            var url = webUrl + "/_api/web/SiteUsers";
            var promise = $.ajax({
                url: url,
                method: "GET",
                headers: { "Accept": "application/json; odata=verbose" }
            });

            return promise;
        },
        AddUsertoGroup: function AddUsertoGroup(groupId, loginName, webUrl) {
            webUrl = ITG.SharePoint.SanitizeWebUrl(webUrl);
            var item = { LoginName: loginName };
            item["__metadata"] = { "type": "SP.User" };
            webUrl = ITG.SharePoint.SanitizeWebUrl(webUrl);
            var promise = $.ajax({
                url: webUrl + "/_api/web/sitegroups(" + groupId + ")/users",
                type: "POST",
                contentType: "application/json;odata=verbose",
                data: JSON.stringify(item),
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "X-RequestDigest": $("#__REQUESTDIGEST").val()
                }
            });
            return promise;
        },
        GetUserId: function getUserId(loginName) {
            var deffered = $.Deferred();
            var context = new SP.ClientContext.get_current();
            var user = context.get_web().ensureUser(loginName);
            context.load(user);
            context.executeQueryAsync(
                 Function.createDelegate(null, function () { deffered.resolve(user); }),
                 Function.createDelegate(null, function () { deffered.reject(user, args); })
            );
            return deffered;
        },
        CreateSubSite: function CreateSubSite(options, webUrl) {
            webUrl = ITG.SharePoint.SanitizeWebUrl(webUrl);
            var createData = {
                parameters: {
                    '__metadata': {
                        'type': 'SP.WebInfoCreationInformation'
                    },
                    Url: options.siteUrl,
                    Title: options.siteName,
                    Description: options.siteDescription,
                    Language: 1033,
                    WebTemplate: options.siteTemplate,
                    UseUniquePermissions: options.uniquePermissions
                    //CustomMasterUrl: options.MasterUrl,
                    //MasterUrl: options.MasterUrl,
                    //EnableMinimalDownload: options.MinimalDownload
                }
            };
            var deffered = $.Deferred();
            // Because we don't have the hidden __REQUESTDIGEST variable, we need to ask the server for the FormDigestValue
            var __REQUESTDIGEST;
            var rootUrl = location.protocol + "//" + location.host;

            var contextInfoPromise = $.ajax({
                url: webUrl + "/_api/contextinfo",
                method: "POST",
                headers: {
                    "Accept": "application/json; odata=verbose"
                },
                success: function (data) {
                    __REQUESTDIGEST = data.d.GetContextWebInformation.FormDigestValue;
                },
                error: function (data, errorCode, errorMessage) {
                    alert(errorMessage);
                }
            });

            // Once we have the form digest value, we can create the subsite
            $.when(contextInfoPromise).done(function () {
                $.ajax({
                    url: webUrl + "/_api/web/webinfos/add",
                    type: "POST",
                    headers: {
                        "accept": "application/json;odata=verbose",
                        "content-type": "application/json;odata=verbose",
                        "X-RequestDigest": __REQUESTDIGEST
                    },
                    data: JSON.stringify(createData)
                }).then(function (data) {
                    deffered.resolve(data);
                });
            });
            return deffered;
        },
        GetWebData: function GetWebData(webUrl) {
            webUrl = ITG.SharePoint.SanitizeWebUrl(webUrl);
            var url = webUrl + "/_api/web";

            var promise = $.ajax({
                url: url,
                method: "GET",
                headers: { "Accept": "application/json; odata=verbose" }
            });
            return promise;
        },
        UpdateWebData: function UpdateWebData(webUrl, updateData) {
            webUrl = ITG.SharePoint.SanitizeWebUrl(webUrl);

            var __REQUESTDIGEST;
            var contextInfoPromise = $.ajax({
                url: webUrl + "/_api/contextinfo",
                method: "POST",
                headers: {
                    "Accept": "application/json; odata=verbose"
                },
                success: function (data) {
                    __REQUESTDIGEST = data.d.GetContextWebInformation.FormDigestValue;
                },
                error: function (data, errorCode, errorMessage) {
                    alert(errorMessage);
                }
            });
            var deff = $.Deferred();
            updateData.__metadata = { "type": "SP.Web" };
            $.when(contextInfoPromise).done(function () {
                ITG.SharePoint.GetWebData(webUrl).then(function (data) {
                    $.ajax({
                        url: data.d.__metadata.uri,
                        type: "POST",
                        contentType: "application/json;odata=verbose",
                        data: JSON.stringify(updateData),
                        headers: {
                            "Accept": "application/json;odata=verbose",
                            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                            "X-HTTP-Method": "MERGE",
                            "If-Match": data.d.__metadata.etag
                        }
                    }).then(function (data1) { deff.resolve(data1) }, function (data1) { deff.reject(data1) });
                });
            });
            return deff;
        }
    }
}]);*/