<TEMPLATE id="MAIN">
<div style="position:relative;width:100%;height:50%;margin-bottom:<%=0-wrapHeight/2%>px"></div>
<div style="width:<%=wrapWidth%>px;height:<%=wrapHeight%>px;-webkit-animation:circle <%=duration%> linear infinite;animation:circle <%=duration%> linear infinite;margin:0 auto;">
    <% for(var i = 0; i < 8; i++) { %>
    <div style="width:<%=dotRadius*2%>px;height:<%=dotRadius*2%>px;border-radius:<%=dotRadius*2%>px;background:<%=dotColor%>;position:absolute;left:<%=radius%>px;top:<%=radius%>px;transform:rotate(<%=i*45%>deg)translateX(12px)"></div>
    <% } %>
</div>
</TEMPLATE>

<TEMPLATE id="STYLE">
@-webkit-keyframes circle {
    from {transform:rotate(0);}
    to {transform:rotate(360deg);}
}
@keyframes circle {
    from {transform:rotate(0);}
    to {transform:rotate(360deg);}
}
</TEMPLATE>