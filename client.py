import wx
import requests
import json
import random

class MyPanel(wx.Panel):
    def __init__(self, parent):
        wx.Panel.__init__(self, parent)
        self.pathfile = ""
        self.parameters = []
        self.quote = wx.StaticText(self, label="Simulador Carga SO1-2013", pos=(20, 30))

        self.lblcompletado = wx.StaticText(self, label="Log :", pos=(20,240))
        self.logger = wx.TextCtrl(self, pos=(20,270), size=(400,270), style=wx.TE_MULTILINE | wx.TE_READONLY)

        self.button =wx.Button(self, label="Start", pos=(450, 210))
        self.Bind(wx.EVT_BUTTON, self.OnClick,self.button)

        self.lblurl = wx.StaticText(self, label="URL :", pos=(20,60))
        self.editurl = wx.TextCtrl(self, value="http://localhost:8000/vote", pos=(150, 60), size=(340,-1))

        self.sampleList = []
        for x in range(0,100):
            self.sampleList.append(str(x))
        self.lblhear = wx.StaticText(self, label="Cantidad :", pos=(20, 90))
        self.cantidad = wx.ComboBox(self, pos=(150, 90), size=(95, -1), choices=self.sampleList, style=wx.CB_DROPDOWN)


        self.lblcompletado = wx.StaticText(self, label="Completed :", pos=(20,210))
        self.gauge = wx.Gauge(self,-1, 50,pos=(150,210), size=(250, 25))


    def OnClick(self,event):
        data = {u'candidato': {u'partido': u'', u'nombre': u''}, u'Location': u''}
        par_can = [["pp", "otto"], ["une", "colom"], ["gana", "berger"], ["frg", "portillo"]]

        print self.cantidad.GetValue()

        for x in range(int(self.cantidad.GetValue())):
            pc = random.choice(par_can)
            data["candidato"]["partido"] = pc[0]
            data["candidato"]["nombre"] = pc[1]

            r = requests.post(self.editurl.GetValue(), json.dumps(data), headers = {'content-type': 'application/json'})
            self.logger.AppendText("Voto emitido"+'\n')

app = wx.App(False)
frame = wx.Frame(None, title="Traffic Simulator", size=(800,600))
panel = MyPanel(frame)
frame.Show()
app.MainLoop()
