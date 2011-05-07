# -*- coding: utf-8 -*-

import urllib2
import os
import random
import math


def printAll(round):
	#Defaults:
	#The directory with teams
	teams = 'teams'
	#The 'head' file
	headFile = 'parts/head'
	
	filename = round + '.html'
	try:
		os.remove(filename)
	except Exception:
		pass
	
	list = []
	
	for dirname, dirnames, filenames in os.walk(teams):
		for pic in filter(filterFiles,filenames):
			list.append(os.path.join(dirname, pic))

	random.shuffle(list)
	print("len list: %d" % len(list))
	
	file = open(filename, 'a')
	file.write(head(headFile))
	
	#1st Stage.
	file.write("<div id='stage1'>")
	numLeaves = int(2 ** math.ceil(math.log(len(list)/4) / math.log(2)))
	numPools = numLeaves / 2
	index = 0
	for pool in range(1, numPools + 1):
		poolSize = (len(list) - index) / (numPools + 1 - pool)
		file.write(stage1(list[index:index + poolSize], pool))
		index += poolSize
	file.write("</div>")


	#2nd Stage.
	file.write("<div id='stage2' style='display:none'>")
	#1st column.
	file.write("<div class='contest col1'>\n")
	for x in range(numLeaves):
		#file.write(col1(list[index:index+8], x, numLeaves))
		file.write(col2(x, 1, numLeaves))
		index += 8
	file.write("</div>")
	
	#Other columns.
	numItems = numLeaves
	numCols = int(math.log(numLeaves, 2)) + 1
	for c in range(2, numCols):
		numItems /= 2
		file.write("<div class='contest col{0}'>".format(c))
		for x in range(numItems):
			file.write(col2(x, c, numItems))
		file.write("</div>")
	#last column
	file.write("<div class='contest col{0}'>".format(numCols))
	file.write(col2(0, numCols, 1))
	file.write("</div>")
	file.write("</div>\n\n")
	
	#End.
	file.write("</body></html>")
	file.close()
	print("%s: total %d pools %d leaves %d" % (filename, len(list), numPools, numLeaves))

def head(headFile):
	header = open(headFile).read()
	return header
	
def stage1(bit, pool):
	body = "<p class='pool-title'><a href='javascript:void(0)' onclick='playStage1(this)'>%s</a></p>\n" % pool
	body += "<div class='pool' id='pool-%d'>\n" % pool
	for i in bit:
		body += pic(i, i)
	body += "</div>\n\n"
	return body

def col2(num, numCol, max):
	ord = num + max
	body = ""
	body += "<div class='slide' id='%d'>\n\t<div class='infos'>\n" % ord
	body += "\t\t<a href='javascript:void(0)' onClick='activate(event)'><span class='info'>vs</span></a>\n"
	body += "\t</div>\n\t<div>\n"
	body +=  "\t\t<a href='javascript:void(0)' onClick='activate(event)'><img src='runtime/placeholder.jpeg' class='placeholder'></a>\n"
	body += "\t</div>\n</div>\n\n"	
	if (num % 2 == 1):
		margin = (266 * 2 ** (numCol - 1) - 6) / 2
		top = margin + 2 ** (numCol - 1) * (num - 1) * 266
		body += "<a href='javascript:void(0)' onClick='play(event)' class='match l%d' style='top:%dpx'> </a>" % (numCol, top)
	return body

def pic(id, name):
	body = "<div class='slide' id='%s'>\n\t<div class='infos'>\n" % id
	body += "\t\t<a href='javascript:void(0)' onClick='activate(event)'><span class='info'>%s</span></a>\n" % html_escape(name)
	body += "\t</div>\n\t<div class='image'>\n"
	body += "\t\t<a href='javascript:void(0)' onClick='activate(event)'><img src='{0}'></a>\n".format(html_escape(unicode(name, "utf-8")))
	body += "\t</div>\n</div>\n\n"
	print(html_escape(name))
	return body

html_escape_table = {
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
    ">": "&gt;",
    "<": "&lt;",
    u"»": "&raquo;",
    u"«": "&laquo;",
    u"‹": "&lsaquo;",
    u"›": "&rsaquo;"
    }

def html_escape(text):
    """Produce entities within text."""
    return "".join(html_escape_table.get(c,c) for c in text)

def fileList(a):
	return a[2]

def filterFiles(str):
	return not (str.startswith("."))
  
printAll("tournament");